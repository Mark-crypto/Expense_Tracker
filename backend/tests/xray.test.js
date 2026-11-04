import { after, before, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { closeDatabase, connection, createUser, removeUsers, request, startServer } from "./helpers.js";

const row = (receiptNo, occurredAt, values) => ({
  receiptNo,
  occurredAt,
  details: "Merchant Payment",
  kind: "till",
  category: "miscellaneous",
  paidIn: 0,
  withdrawn: 0,
  save: false,
  ...values,
});

const OCTOBER = [
  row("OCT0000001", "2026-10-01 08:00:00", { kind: "received", details: "Business Payment from ACME LTD", counterparty: "ACME LTD", paidIn: 60000 }),
  row("OCT0000002", "2026-10-02 09:00:00", { kind: "received", details: "Funds received from - Mary Atieno", counterparty: "Mary Atieno", paidIn: 4000 }),
  row("OCT0000003", "2026-10-03 10:00:00", { kind: "fuliza", details: "OverDraft of Credit Party", paidIn: 1000 }),
  row("OCT0000004", "2026-10-04 10:00:00", { counterparty: "Naivas", withdrawn: 9000, category: "food", save: true }),
  row("OCT0000005", "2026-10-05 10:00:00", { counterparty: "Naivas", withdrawn: 4000, category: "food", save: true }),
  row("OCT0000006", "2026-10-06 10:00:00", { counterparty: "Naivas", withdrawn: 500, category: "food", save: true }),
  row("OCT0000007", "2026-10-07 10:00:00", { kind: "send", details: "Customer Transfer to - Brian Otieno", counterparty: "Brian Otieno", withdrawn: 3000, save: true }),
  row("OCT0000008", "2026-10-07 10:00:00", { kind: "fee", details: "Customer Transfer of Funds Charge", withdrawn: 600 }),
  row("OCT0000009", "2026-10-08 10:00:00", { kind: "fuliza", details: "OD Loan Repayment to Fuliza", withdrawn: 1200 }),
  row("OCT0000010", "2026-10-09 10:00:00", { kind: "paybill", details: "Pay Bill to 247247 - Equity Paybill", counterparty: "Equity Paybill", withdrawn: 20000 }),
];

const SEPTEMBER = [
  row("SEP0000001", "2026-09-01 08:00:00", { kind: "received", details: "Business Payment from ACME LTD", counterparty: "ACME LTD", paidIn: 60000 }),
  row("SEP0000002", "2026-09-04 10:00:00", { counterparty: "Naivas", withdrawn: 8000, category: "food", save: true }),
  row("SEP0000003", "2026-09-07 10:00:00", { kind: "fee", details: "Customer Transfer of Funds Charge", withdrawn: 300 }),
  row("SEP0000004", "2026-09-08 10:00:00", { kind: "fuliza", details: "OD Loan Repayment to Fuliza", withdrawn: 600 }),
];

describe("Money X-ray", () => {
  let server, api, user, other;
  const xray = async (who, period) =>
    (await request(api, "GET", `/insights/xray${period ? `?period=${period}` : ""}`, { cookie: who.cookie })).body.xray;
  const save = (who, transactions) => request(api, "POST", "/mpesa/save", { cookie: who.cookie, body: { transactions } });

  before(async () => {
    ({ server, api } = await startServer());
    user = await createUser(api);
    other = await createUser(api);
  });

  beforeEach(async () => {
    for (const table of ["mpesa_transactions", "expense", "accounts", "account_balances", "account_transfers"]) {
      await connection.execute(`DELETE FROM ${table} WHERE user_id = ?`, [user.id]);
    }
  });

  after(async () => {
    await removeUsers([user, other]);
    server.close();
    await closeDatabase();
  });

  it("shows nothing before a statement is imported", async () => {
    assert.equal(await xray(user), null);
  });

  it("splits money in by source, labelling Fuliza as borrowed", async () => {
    await save(user, OCTOBER);
    const result = await xray(user);
    assert.equal(result.period, "2026-10");
    assert.equal(result.moneyIn, 65000);
    assert.equal(result.moneyOut, 38300);
    assert.equal(result.kept, 26700);
    assert.deepEqual(
      result.sources.map(({ key, total }) => [key, total]),
      [["business", 60000], ["people", 4000], ["fuliza", 1000]]
    );
  });

  it("groups money out by category, with people, fees and repayments apart", async () => {
    await save(user, OCTOBER);
    const result = await xray(user);
    const total = (key) => result.outs.find((group) => group.key === key)?.total;
    assert.equal(total("food"), 13500);
    assert.equal(total("people"), 3000);
    assert.equal(total("fees"), 600);
    assert.equal(total("fuliza"), 1200);
    const food = result.outs.find((group) => group.key === "food");
    assert.deepEqual(food.merchants[0], { name: "Naivas", total: 13500, count: 3 });
    assert.deepEqual(result.people[0], { name: "Brian Otieno", total: 3000, count: 1 });
    assert.equal(result.businesses[0].name, "Equity Paybill");
  });

  it("totals fees and debt repayments", async () => {
    await save(user, OCTOBER);
    const { costs } = await xray(user);
    assert.equal(costs.total, 1800);
    assert.equal(costs.fulizaBorrowed, 1000);
    assert.equal(costs.share, 4.7);
  });

  it("follows a category changed in Expenses", async () => {
    await save(user, OCTOBER);
    await connection.execute("UPDATE expense SET category = 'family' WHERE user_id = ? AND receipt_no = 'OCT0000007'", [user.id]);
    const result = await xray(user);
    assert.equal(result.outs.find((group) => group.key === "family").total, 3000);
    assert.equal(result.outs.some((group) => group.key === "people"), false);
  });

  it("shows money moved to your own accounts on its own", async () => {
    await save(user, OCTOBER);
    await request(api, "POST", "/accounts", { cookie: user.cookie, body: { name: "M-Pesa", type: "mpesa", balance: 0 } });
    const bank = (await request(api, "POST", "/accounts", { cookie: user.cookie, body: { name: "Bank", type: "bank", balance: 0 } })).body.id;
    await connection.execute("UPDATE account_balances SET as_of = '2026-09-01' WHERE user_id = ?", [user.id]);
    const { questions } = (await request(api, "GET", "/accounts", { cookie: user.cookie })).body;
    await request(api, "POST", `/accounts/questions/${questions.items[0].id}`, { cookie: user.cookie, body: { accountId: bank } });

    const result = await xray(user);
    assert.equal(result.outs.find((group) => group.key === "moves").total, 20000);
    assert.equal(result.businesses.some((row) => row.name === "Equity Paybill"), false);
    assert.equal(result.costs.share, 9.8);
  });

  it("waits for two months before giving findings", async () => {
    await save(user, OCTOBER);
    assert.equal((await xray(user)).findings, null);
  });

  it("compares a month with the one before", async () => {
    await save(user, [...SEPTEMBER, ...OCTOBER]);
    const result = await xray(user);
    assert.deepEqual(result.months, ["2026-09", "2026-10"]);
    assert.deepEqual(result.findings, [
      "M-Pesa fees almost doubled to KES 600.",
      "{{food}} went up KES 5,500, mostly at Naivas.",
      "Fuliza repayments almost doubled to KES 1,200.",
    ]);
  });

  it("covers every month together", async () => {
    await save(user, [...SEPTEMBER, ...OCTOBER]);
    const result = await xray(user, "all");
    assert.equal(result.period, "all");
    assert.equal(result.moneyIn, 125000);
    assert.match(result.findings[0], /Fees cost you KES 900 across 2 months/);
    assert.deepEqual(result.periodRange, { from: "2026-09-01", to: "2026-10-31" });
  });

  it("shows the earliest month without comparing it", async () => {
    await save(user, [...SEPTEMBER, ...OCTOBER]);
    const result = await xray(user, "2026-09");
    assert.equal(result.moneyIn, 60000);
    assert.equal(result.findings.some((text) => text.includes("rose") || text.includes("went up")), false);
  });

  it("names every group on the map unless there are too many", async () => {
    const extra = ["clothing", "pets", "gifts", "education", "healthcare", "insurance", "work"].map((category, index) =>
      row(`OCX000000${index}`, "2026-10-20 10:00:00", { counterparty: category, withdrawn: 100 + index, category, save: true })
    );
    await save(user, [...OCTOBER, ...extra.slice(0, 1)]);
    let result = await xray(user);
    assert.equal(result.map.some((group) => group.key === "rest"), false);

    await save(user, extra);
    result = await xray(user);
    assert.equal(result.map.length, 9);
    assert.equal(result.map.at(-1).key, "rest");
  });

  it("only shows a user's own statements", async () => {
    await save(user, OCTOBER);
    assert.equal(await xray(other), null);
  });
});
