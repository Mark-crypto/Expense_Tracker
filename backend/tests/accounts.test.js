import { after, before, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { closeDatabase, connection, createUser, removeUsers, request, startServer } from "./helpers.js";
import { extractMpesaLines } from "../utils/extractMpesaLines.js";
import { addDays, today } from "../utils/dates.js";

describe("accounts and safe to spend", () => {
  let server, api;
  let users, handedOut;
  const WIPED = [
    "notifications",
    "expense",
    "mpesa_transactions",
    "merchant_categories",
    "recurring_payments",
    "account_balances",
    "account_income",
    "account_transfers",
    "accounts",
    "expense_shortcuts",
  ];

  // Logins are rate limited, so tests share two users and start from empty.
  const newUser = async () => users[handedOut++];
  const call = (user, method, path, body) => request(api, method, path, { cookie: user.cookie, body });
  const addAccount = async (user, name, type, balance, extra = {}) =>
    (await call(user, "POST", "/accounts", { name, type, balance, ...extra })).body.id;
  const spend = (user, amount, accountId, date = today(), merchant = "Naivas") =>
    call(user, "POST", "/expenses", {
      amount,
      category: "food",
      date,
      merchant,
      accountId,
      subcategories: [{ name: merchant, amount }],
    });
  const balances = async (user) => {
    const { body } = await call(user, "GET", "/accounts");
    return Object.fromEntries(body.accounts.map((account) => [account.name, account.balance]));
  };
  const overview = async (user) => (await call(user, "GET", "/dashboard/overview")).body;
  const statementRow = (receiptNo, occurredAt, values) => ({
    receiptNo,
    occurredAt,
    details: "Payment",
    kind: "till",
    category: "food",
    paidIn: 0,
    withdrawn: 0,
    save: false,
    ...values,
  });

  before(async () => {
    ({ server, api } = await startServer());
    users = [await createUser(api), await createUser(api)];
  });

  beforeEach(async () => {
    handedOut = 0;
    for (const { id } of users) {
      for (const table of WIPED) await connection.execute(`DELETE FROM ${table} WHERE user_id = ?`, [id]);
      await connection.execute("UPDATE users SET pay_type = 'irregular', pay_day = NULL, safety_buffer = 2000 WHERE user_id = ?", [id]);
    }
  });

  after(async () => {
    await removeUsers(users);
    server.close();
    await closeDatabase();
  });

  it("takes expenses off the chosen account and lets an update correct it", async () => {
    const user = await newUser();
    const mpesa = await addAccount(user, "M-Pesa", "mpesa", 10000);
    const bank = await addAccount(user, "Bank", "bank", 5000);

    await spend(user, 1000, mpesa);
    await spend(user, 400, bank);
    assert.deepEqual(await balances(user), { "M-Pesa": 9000, Bank: 4600 });

    await call(user, "POST", `/accounts/${bank}/balance`, { balance: 4000 });
    assert.equal((await balances(user)).Bank, 4000);

    await spend(user, 500, bank);
    assert.equal((await balances(user)).Bank, 3500);
  });

  it("ignores an expense dated before the balance was set", async () => {
    const user = await newUser();
    const bank = await addAccount(user, "Bank", "bank", 5000);
    await spend(user, 300, bank, addDays(today(), -3));
    assert.equal((await balances(user)).Bank, 5000);
  });

  it("uses the default account when none or another user's is sent", async () => {
    const user = await newUser();
    const other = await newUser();
    const theirs = await addAccount(other, "Bank", "bank", 1000);
    await addAccount(user, "M-Pesa", "mpesa", 2000);

    await spend(user, 100, theirs);
    await spend(user, 100, undefined);
    assert.equal((await balances(user))["M-Pesa"], 1800);
    assert.equal((await balances(other)).Bank, 1000);
  });

  it("moves money without changing the total, and undoes it", async () => {
    const user = await newUser();
    const mpesa = await addAccount(user, "M-Pesa", "mpesa", 10000);
    const bank = await addAccount(user, "Bank", "bank", 2000);

    const same = await call(user, "POST", "/accounts/transfers", { fromId: bank, toId: bank, amount: 1, date: today() });
    assert.equal(same.status, 400);

    await call(user, "POST", "/accounts/transfers", { fromId: mpesa, toId: bank, amount: 3000, date: today() });
    assert.deepEqual(await balances(user), { "M-Pesa": 7000, Bank: 5000 });

    const { body } = await call(user, "GET", `/accounts?month=${today().slice(0, 7)}`);
    assert.equal(body.total, 12000);
    assert.equal(body.report.biggestFall, null);
    await call(user, "DELETE", body.activity[0].path);
    assert.deepEqual(await balances(user), { "M-Pesa": 10000, Bank: 2000 });
  });

  it("adds money in and counts it toward Money in", async () => {
    const user = await newUser();
    const bank = await addAccount(user, "Bank", "bank", 1000);
    await call(user, "POST", "/accounts/income", { accountId: bank, amount: 25000, name: "Client", date: today() });
    assert.equal((await balances(user)).Bank, 26000);
    const { monthly } = await overview(user);
    assert.equal(monthly.find((row) => row.month === today().slice(0, 7)).moneyIn, 25000);
  });

  it("takes M-Pesa's balance from a statement, keeping a negative Fuliza balance", async () => {
    const user = await newUser();
    const mpesa = await addAccount(user, "M-Pesa", "mpesa", 9999);
    const day = addDays(today(), -1);
    await connection.execute("UPDATE account_balances SET as_of = ? WHERE account_id = ?", [addDays(today(), -5), mpesa]);
    await call(user, "POST", "/mpesa/save", {
      transactions: [
        statementRow("ABC1234568", `${day} 12:00:00`, { withdrawn: 700, balance: -200, save: true, counterparty: "Shop" }),
        statementRow("ABC1234567", `${day} 09:00:00`, { paidIn: 500, balance: 500, kind: "received" }),
      ],
    });
    assert.equal((await balances(user))["M-Pesa"], -200);

    await spend(user, 100, mpesa);
    assert.equal((await balances(user))["M-Pesa"], -300);

    const lines = extractMpesaLines("ABC1234567 2026-10-01 10:00:00 Merchant Payment - Shop Completed -700.00 -200.00");
    assert.equal(lines[0].balance, -200);
  });

  it("reports a month where in, out and adjustments add up", async () => {
    const user = await newUser();
    const bank = await addAccount(user, "Bank", "bank", 5000);
    await connection.execute("UPDATE account_balances SET as_of = ? WHERE account_id = ?", [addDays(today(), -1), bank]);
    await spend(user, 1000, bank);
    await call(user, "POST", `/accounts/${bank}/balance`, { balance: 3000 });

    const { report } = (await call(user, "GET", `/accounts?month=${today().slice(0, 7)}`)).body;
    const [row] = report.rows;
    assert.deepEqual(
      [row.start, row.moneyOut, row.end, row.change, row.adjusted],
      [5000, 1000, 3000, -2000, -1000]
    );
    assert.equal(report.biggestFall, "Bank");
  });

  it("asks about a likely transfer and stops it counting as spending", async () => {
    const user = await newUser();
    await addAccount(user, "M-Pesa", "mpesa", 1000);
    const bank = await addAccount(user, "Bank", "bank", 1000);
    await call(user, "POST", "/mpesa/save", {
      transactions: [
        statementRow("ABD1234567", `${today()} 09:00:00`, {
          kind: "paybill",
          counterparty: "Equity Paybill",
          withdrawn: 5000,
          balance: 2000,
          save: true,
        }),
      ],
    });

    const { questions } = (await call(user, "GET", "/accounts")).body;
    assert.equal(questions.total, 1);
    await call(user, "POST", `/accounts/questions/${questions.items[0].id}`, { accountId: bank });

    const after = (await call(user, "GET", "/accounts")).body;
    assert.equal(after.questions.total, 0);
    assert.equal(after.accounts.find((account) => account.id === bank).balance, 6000);
    const [[{ count }]] = await connection.execute(
      "SELECT COUNT(*) AS count FROM expense WHERE user_id = ? AND receipt_no = 'ABD1234567' AND status = 'active'",
      [user.id]
    );
    assert.equal(count, 0);
  });

  it("treats a withdrawal as a move to Cash", async () => {
    const user = await newUser();
    await addAccount(user, "M-Pesa", "mpesa", 3000);
    await addAccount(user, "Cash", "cash", 100);
    await call(user, "POST", "/mpesa/save", {
      transactions: [
        statementRow("ABE1234567", `${today()} 09:00:00`, { kind: "withdrawal", withdrawn: 1000, balance: 2000, save: true }),
      ],
    });
    assert.deepEqual(await balances(user), { "M-Pesa": 2000, Cash: 1100 });
  });

  it("works out a salaried daily number and keeps it steady through the day", async () => {
    const user = await newUser();
    const mpesa = await addAccount(user, "M-Pesa", "mpesa", 50000);
    await addAccount(user, "Savings", "savings", 90000, { spendable: false });
    const payDay = Number(addDays(today(), 10).slice(8));
    await call(user, "PUT", "/accounts/pay-settings", { payType: "salary", payDay, buffer: 2000 });
    await call(user, "POST", "/bills", {
      name: "Rent",
      category: "housing",
      amount: 18000,
      frequency: "monthly",
      nextDue: addDays(today(), 2),
    });

    const first = (await overview(user)).safeToSpend;
    assert.equal(first.days, 10);
    assert.equal(first.pool, 30000);
    assert.equal(first.daily, 3000);

    await spend(user, 4000, mpesa);
    const later = (await overview(user)).safeToSpend;
    assert.equal(later.daily, 3000);
    assert.equal(later.spentToday, 4000);
    assert.equal(later.leftToday, 0);
    assert.equal((await call(user, "GET", "/forecast")).body.safeToday, 3000);
  });

  it("spreads irregular income over 30 days", async () => {
    const user = await newUser();
    await addAccount(user, "M-Pesa", "mpesa", 32000);
    const safe = (await overview(user)).safeToSpend;
    assert.equal(safe.days, 30);
    assert.equal(safe.daily, 1000);
  });

  it("isn't ready with no accounts or statement, and estimates from a statement", async () => {
    const user = await newUser();
    assert.equal((await overview(user)).safeToSpend.ready, false);

    const day = addDays(today(), -2);
    await call(user, "POST", "/mpesa/save", {
      transactions: [statementRow("ABF1234567", `${day} 09:00:00`, { paidIn: 12000, balance: 32000, kind: "received" })],
    });
    await spend(user, 2000, undefined);
    const safe = (await overview(user)).safeToSpend;
    assert.equal(safe.ready, true);
    assert.equal(safe.statementDate, day);
    assert.equal(safe.daily, 1000);
  });

  it("warns when a bill's account will run short and suggests where to move from", async () => {
    const user = await newUser();
    await addAccount(user, "M-Pesa", "mpesa", 38500);
    const bank = await addAccount(user, "Bank", "bank", 10000);
    await call(user, "POST", "/bills", {
      name: "Rent",
      category: "housing",
      amount: 18000,
      frequency: "monthly",
      nextDue: addDays(today(), 4),
      accountId: bank,
    });
    const { lowBalance } = await overview(user);
    assert.deepEqual(
      [lowBalance.name, lowBalance.accountName, lowBalance.short, lowBalance.fromName],
      ["Rent", "Bank", 8000, "M-Pesa"]
    );
  });

  it("shows the next two weeks of payments on the dashboard", async () => {
    const user = await newUser();
    const add = (name, category, amount, frequency, nextDue) =>
      call(user, "POST", "/bills", { name, category, amount, frequency, nextDue });
    assert.equal((await overview(user)).upcoming.tracked, 0);

    await add("Chama", "savings", 1000, "weekly", addDays(today(), 1));
    await add("Spotify", "entertainment", 300, "monthly", addDays(today(), 3));
    await add("Rent", "housing", 18000, "monthly", addDays(today(), 20));

    const { upcoming } = await overview(user);
    assert.equal(upcoming.tracked, 3);
    assert.equal(upcoming.days.length, 14);
    assert.deepEqual(upcoming.items.map((item) => item.name), ["Chama", "Spotify", "Chama"]);
    assert.deepEqual(upcoming.items.map((item) => item.canAct), [true, true, false]);
    assert.equal(upcoming.items[1].kind, "subscription");
    assert.equal(upcoming.total, 2300);
    assert.equal(upcoming.heavyWeek.total, 1300);
  });

  it("adds a captured bill to its pay-from account", async () => {
    const user = await newUser();
    await addAccount(user, "M-Pesa", "mpesa", 5000);
    const bank = await addAccount(user, "Bank", "bank", 9000);
    await call(user, "POST", "/bills", {
      name: "Internet",
      category: "utilities",
      amount: 3000,
      frequency: "monthly",
      nextDue: today(),
      accountId: bank,
    });
    assert.equal((await balances(user)).Bank, 6000);
  });

  it("removes an account from balances but keeps its expenses", async () => {
    const user = await newUser();
    const bank = await addAccount(user, "Bank", "bank", 900);
    await spend(user, 100, bank);
    await call(user, "DELETE", `/accounts/${bank}`);
    const { body } = await call(user, "GET", "/accounts");
    assert.equal(body.accounts.length, 0);
    const [[{ count }]] = await connection.execute(
      "SELECT COUNT(*) AS count FROM expense WHERE user_id = ? AND status = 'active'",
      [user.id]
    );
    assert.equal(count, 1);
  });

  it("saves shortcuts and remembers each merchant's last account", async () => {
    const user = await newUser();
    await addAccount(user, "M-Pesa", "mpesa", 5000);
    const cash = await addAccount(user, "Cash", "cash", 900);
    await spend(user, 80, cash, today(), "Matatu");
    const saved = await call(user, "POST", "/expenses/shortcuts", { merchant: "Matatu", category: "transportation", accountId: cash });
    assert.equal(saved.status, 201);

    const { body } = await call(user, "GET", "/expenses/quick-add");
    assert.equal(body.lastAccounts.matatu, cash);
    assert.equal(body.shortcuts[0].account_id, cash);

    await call(user, "DELETE", `/expenses/shortcuts/${body.shortcuts[0].id}`);
    assert.equal((await call(user, "GET", "/expenses/quick-add")).body.shortcuts.length, 0);
  });
});
