import { after, before, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { closeDatabase, connection, createUser, mails, removeUsers, request, startServer } from "./helpers.js";
import { addCycle, detectRecurring, heaviestWeek, runBillJob, today } from "../utils/recurring.js";

const offset = (days) => {
  const date = new Date(`${today()}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

describe("bills", () => {
  let server, api, user, other;
  const call = (method, path, body, who = user) => request(api, method, path, { cookie: who.cookie, body });
  const bills = async () => (await call("GET", "/bills")).body;
  const track = async (name, extra = {}) =>
    (await call("POST", "/bills", { name, category: "utilities", amount: 2000, frequency: "monthly", nextDue: today(), ...extra })).body.id;
  const expensesFor = async (name) => {
    const [rows] = await connection.execute(
      "SELECT amount, source, needs_review, status FROM expense WHERE user_id = ? AND merchant = ?",
      [user.id, name]
    );
    return rows;
  };
  // Tracked bills roll forward when created, so dating one back needs the database.
  const makeDue = (id, date) =>
    connection.execute("UPDATE recurring_payments SET next_due = ?, due_day = ? WHERE id = ?", [date, Number(date.slice(8)), id]);

  before(async () => {
    ({ server, api } = await startServer());
    user = await createUser(api);
    other = await createUser(api);
  });

  beforeEach(async () => {
    for (const table of ["recurring_payments", "recurring_price_changes", "expense", "notifications", "dismissed_bills"]) {
      await connection.execute(`DELETE FROM ${table} WHERE user_id = ?`, [user.id]);
    }
  });

  after(async () => {
    await removeUsers([user, other]);
    server.close();
    await closeDatabase();
  });

  it("keeps the due day through short months", () => {
    assert.equal(addCycle("2027-01-31", "monthly", 31), "2027-02-28");
    assert.equal(addCycle("2027-02-28", "monthly", 31), "2027-03-31");
    assert.equal(addCycle("2027-01-10", "termly", 10), "2027-05-10");
    assert.equal(addCycle("2027-01-10", "weekly", 10), "2027-01-17");
  });

  it("detects weekly, monthly, termly and yearly payments, but not random ones", () => {
    const series = (name, dates, amount = 1000) =>
      dates.map((date) => ({ merchant: name, category: "other", amount, date }));
    const now = "2026-11-01";
    const found = detectRecurring(
      [
        ...series("Chama", ["2026-10-04", "2026-10-11", "2026-10-18", "2026-10-25"]),
        ...series("Netflix", ["2026-08-06", "2026-09-06", "2026-10-06"]),
        ...series("School", ["2026-01-05", "2026-05-04", "2026-09-07"]),
        ...series("Insurance", ["2025-10-20", "2026-10-20"]),
        ...series("Naivas", ["2026-08-01", "2026-08-03", "2026-10-30"]),
      ],
      new Set(),
      now
    );
    const byName = Object.fromEntries(found.map((row) => [row.name, row.frequency]));
    assert.deepEqual(byName, { Chama: "weekly", Netflix: "monthly", School: "termly", Insurance: "yearly" });
  });

  it("captures a due bill once, marked for confirmation", async () => {
    const id = await track("Netflix", { amount: 1399 });
    await makeDue(id, offset(-1));
    await bills();
    await bills();
    await runBillJob();

    const rows = await expensesFor("Netflix");
    const captured = rows.filter((row) => row.source === "auto");
    assert.equal(captured.length, 1);
    assert.equal(captured[0].needs_review, 1);
    assert.equal(Number(captured[0].amount), 1399);

    const { active, captures } = await bills();
    assert.equal(captures.length, 1);
    assert.ok(active[0].next_due > today());
  });

  it("does not capture what was already paid by hand", async () => {
    const id = await track("Rent", { amount: 18000 });
    await call("POST", "/expenses", {
      amount: 18000, category: "housing", date: offset(-1), merchant: "Rent",
      subcategories: [{ name: "Rent", amount: 18000 }],
    });
    await makeDue(id, today());
    await bills();
    assert.equal((await expensesFor("Rent")).filter((row) => row.source === "auto").length, 0);
  });

  it("replaces an automatic capture when the real payment is added", async () => {
    const id = await track("KPLC", { amount: 2000, varies: true });
    await makeDue(id, offset(-2));
    await bills();
    await call("POST", "/expenses", {
      amount: 2600, category: "utilities", date: offset(-1), merchant: "KPLC",
      subcategories: [{ name: "KPLC", amount: 2600 }],
    });
    const rows = await expensesFor("KPLC");
    assert.equal(rows.find((row) => row.source === "auto").status, "inactive");
    assert.equal((await bills()).captures.length, 0);
  });

  it("alerts when a fixed price changes", async () => {
    await track("Netflix", { amount: 1200, nextDue: offset(3) });
    await call("POST", "/expenses", {
      amount: 1400, category: "technology", date: today(), merchant: "Netflix",
      subcategories: [{ name: "Netflix", amount: 1400 }],
    });
    const [alerts] = await connection.execute("SELECT message FROM notifications WHERE user_id = ? AND type = 'bill'", [user.id]);
    assert.match(alerts[0].message, /Netflix went up by KES 200/);
    assert.equal((await bills()).active[0].amount, 1400);
  });

  it("confirms with a real amount, or removes a capture", async () => {
    const id = await track("KPLC", { varies: true });
    await makeDue(id, offset(-1));
    const [capture] = (await bills()).captures;
    assert.equal(capture.varies, true);
    await call("POST", `/bills/captures/${capture.expense_id}/confirm`, { amount: 2750 });
    let [row] = await expensesFor("KPLC");
    assert.equal(Number(row.amount), 2750);
    assert.equal(row.needs_review, 0);

    const second = await track("Water");
    await makeDue(second, offset(-1));
    const [water] = (await bills()).captures;
    await call("POST", `/bills/captures/${water.expense_id}/reject`);
    [row] = await expensesFor("Water");
    assert.equal(row.status, "inactive");
  });

  it("stops future captures with an optional reason and can restart", async () => {
    const id = await track("Showmax");
    await makeDue(id, offset(-1));
    await bills();
    await call("POST", `/bills/${id}/stop`, { reason: "cancelled", note: "Too few shows" });
    await makeDue(id, offset(-1));
    await bills();
    assert.equal((await expensesFor("Showmax")).length, 1);

    const { stopped, active } = await bills();
    assert.equal(active.length, 0);
    assert.equal(stopped[0].stop_reason, "cancelled");
    assert.equal(stopped[0].stop_note, "Too few shows");

    assert.equal((await call("POST", `/bills/${id}/restart`)).status, 200);
    const restarted = (await bills()).active[0];
    assert.ok(restarted.next_due >= today());
  });

  it("stops without a reason too", async () => {
    const id = await track("Gym");
    assert.equal((await call("POST", `/bills/${id}/stop`, {})).status, 200);
  });

  it("marks a bill paid and skips the next one", async () => {
    const id = await track("Internet", { amount: 2999, nextDue: offset(2) });
    await call("POST", `/bills/${id}/paid`, {});
    const after = (await bills()).active[0];
    assert.ok(after.next_due > offset(20));
    assert.equal((await expensesFor("Internet"))[0].source, "manual");

    await call("POST", `/bills/${id}/skip`);
    assert.ok((await bills()).active[0].next_due > offset(50));
  });

  it("sends one reminder, by email only when switched on", async () => {
    await track("Rent", { nextDue: offset(2) });
    mails.length = 0;
    await runBillJob();
    await runBillJob();
    const [alerts] = await connection.execute("SELECT id FROM notifications WHERE user_id = ? AND type = 'bill'", [user.id]);
    assert.equal(alerts.length, 1);
    assert.equal(mails.filter((mail) => mail.to === user.email).length, 1);

    await call("PATCH", "/bills/reminders", { enabled: false });
    assert.equal((await bills()).reminders, false);
    await track("Water", { nextDue: offset(2) });
    mails.length = 0;
    await runBillJob();
    assert.equal(mails.filter((mail) => mail.to === user.email).length, 0);
    await call("PATCH", "/bills/reminders", { enabled: true });
  });

  it("feeds the forecast, and stopped bills leave it", async () => {
    const id = await track("Tuition", { amount: 5000 });
    const forecast = (await call("GET", "/forecast")).body;
    assert.ok(forecast.bills.some((bill) => bill.tracked && bill.name === "Tuition"));
    await call("POST", `/bills/${id}/stop`, {});
    const after = (await call("GET", "/forecast")).body;
    assert.equal(after.bills.filter((bill) => bill.tracked).length, 0);
  });

  it("separates bills from subscriptions", async () => {
    await track("KPLC", { amount: 2000, nextDue: offset(3) });
    await track("Spotify", { amount: 300, category: "entertainment", nextDue: offset(3) });
    await track("Gym", { amount: 1000, kind: "subscription", nextDue: offset(3) });
    const { active, summary } = await bills();
    const kinds = Object.fromEntries(active.map((bill) => [bill.name, bill.kind]));
    assert.deepEqual(kinds, { KPLC: "bill", Spotify: "subscription", Gym: "subscription" });
    assert.equal(summary.bills, 2000);
    assert.equal(summary.subscriptions, 1300);
    assert.equal(summary.subscriptionsYearly, 15600);
    assert.equal(summary.monthly, 3300);

    const gym = active.find((bill) => bill.name === "Gym");
    await call("PATCH", `/bills/${gym.id}`, {
      name: "Gym", kind: "bill", category: "utilities", amount: 1000, frequency: "monthly", nextDue: offset(3),
    });
    assert.equal((await bills()).summary.bills, 3000);
    assert.equal((await call("POST", "/bills", {
      name: "Bad", kind: "other", category: "food", amount: 10, frequency: "monthly", nextDue: today(),
    })).status, 400);
  });

  it("keeps price history from payments and edits", async () => {
    const id = await track("Netflix", { amount: 1200, nextDue: offset(3) });
    await call("POST", "/expenses", {
      amount: 1400, category: "technology", date: today(), merchant: "Netflix",
      subcategories: [{ name: "Netflix", amount: 1400 }],
    });
    await call("PATCH", `/bills/${id}`, {
      name: "Netflix", category: "technology", amount: 1500, frequency: "monthly", nextDue: offset(30),
    });
    const [bill] = (await bills()).active;
    assert.deepEqual(bill.priceChanges.map(({ from, to }) => [from, to]), [[1400, 1500], [1200, 1400]]);
    assert.equal(bill.yearly, 18000);
  });

  it("does not keep price history for amounts that vary", async () => {
    const id = await track("KPLC", { amount: 2000, varies: true, nextDue: offset(3) });
    await call("PATCH", `/bills/${id}`, {
      name: "KPLC", category: "utilities", amount: 2500, varies: true, frequency: "monthly", nextDue: offset(3),
    });
    assert.equal((await bills()).active[0].priceChanges.length, 0);
  });

  it("finds the heaviest week", () => {
    const week = heaviestWeek([
      { date: "2026-11-02", amount: 100 },
      { date: "2026-11-10", amount: 5000 },
      { date: "2026-11-12", amount: 3000 },
      { date: "2026-11-25", amount: 9000 },
    ]);
    assert.deepEqual(week, { from: "2026-11-10", to: "2026-11-12", total: 8000 });
  });

  it("shows paid, to-confirm and upcoming payments on the calendar", async () => {
    const auto = await track("Water", { amount: 800 });
    await makeDue(auto, today());
    await track("Rent", { amount: 18000, frequency: "monthly", nextDue: offset(40) });
    await bills();
    const dueMonth = offset(40).slice(0, 7);

    const here = (await call("GET", "/bills/calendar")).body;
    assert.equal(here.items.find((item) => item.name === "Water").status, "confirm");

    const later = (await call("GET", `/bills/calendar?month=${dueMonth}`)).body;
    const rent = later.items.find((item) => item.name === "Rent");
    assert.equal(rent.status, "due");
    assert.equal(rent.canAct, true);
    assert.equal((await call("GET", "/bills/calendar?month=2026-13")).status, 400);
  });

  it("tells the dashboard what needs attention", async () => {
    await track("Rent", { amount: 18000, nextDue: offset(3) });
    const due = await track("Water");
    await makeDue(due, offset(-1));
    const { bills: attention } = (await call("GET", "/dashboard/overview")).body;
    assert.deepEqual(attention, { dueCount: 1, dueTotal: 18000, toConfirm: 1 });
  });

  it("keeps each user's bills private", async () => {
    const id = await track("Private");
    assert.equal((await call("POST", `/bills/${id}/stop`, {}, other)).status, 404);
    assert.equal((await call("PATCH", `/bills/${id}`, {
      name: "Hacked", category: "food", amount: 1, frequency: "monthly", nextDue: today(),
    }, other)).status, 404);
    assert.equal((await bills()).active.length, 1);
  });

  it("rejects bad input", async () => {
    assert.equal((await call("POST", "/bills", { name: "", category: "food", amount: 10, frequency: "monthly", nextDue: today() })).status, 400);
    assert.equal((await call("POST", "/bills", { name: "A", category: "food", amount: 10, frequency: "daily", nextDue: today() })).status, 400);
    await track("Twice");
    assert.equal((await call("POST", "/bills", { name: "twice", category: "food", amount: 10, frequency: "monthly", nextDue: today() })).status, 409);
  });
});
