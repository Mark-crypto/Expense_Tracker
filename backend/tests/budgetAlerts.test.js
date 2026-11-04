import { after, before, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { closeDatabase, connection, createUser, mails, removeUsers, request, startServer } from "./helpers.js";
import { flushBudgetEmails, isQuietHour, sendWeeklyDigests } from "../utils/budgetStatus.js";

const today = new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Nairobi" });

describe("budget alerts", () => {
  let server, api, user;

  const call = (method, path, body) => request(api, method, path, { cookie: user.cookie, body });
  const budget = (name, category, amount, extra = {}) =>
    call("POST", "/budget", { name, category, amount, subcategories: [{ name: "Planned", amount }], ...extra });
  const spend = (amount, category) =>
    call("POST", "/expenses", { amount, category, date: today, subcategories: [{ name: "Item", amount }] });
  const alerts = async () => (await call("GET", "/notifications")).body.data;
  const refresh = () => call("GET", "/budgets/overview");

  before(async () => {
    ({ server, api } = await startServer());
    user = await createUser(api);
  });

  beforeEach(async () => {
    mails.length = 0;
    for (const table of ["notifications", "expense", "budget", "budget_limits", "budget_alerts", "budget_changes"]) {
      await connection.execute(`DELETE FROM ${table} WHERE user_id = ?`, [user.id]);
    }
    await call("PUT", "/budgets/alert-settings", { mode: "balanced", warnAt: 80, emails: true });
  });

  after(async () => {
    await removeUsers([user]);
    server.close();
    await closeDatabase();
  });

  const ofType = async (type) => (await alerts()).filter((row) => row.type === type);
  const idOf = async (name) =>
    (await call("GET", "/budgets/overview")).body.budgets.find((row) => row.name === name).budget_id;

  it("warns once at the threshold, even after it's read", async () => {
    await budget("food", "food", 1000);
    await spend(850, "food");
    const [warning] = await ofType("info");
    assert.match(warning.message, /85% used, KES 150 left/);

    await call("PATCH", `/notifications/mark-as-read/${warning.id}`);
    await spend(10, "food");
    assert.equal((await ofType("info")).length, 0);
  });

  it("skips earlier thresholds when spending jumps past them", async () => {
    await call("PUT", "/budgets/alert-settings", { mode: "everything", warnAt: 80, emails: true });
    await budget("food", "food", 1000);
    await spend(900, "food");
    assert.equal((await ofType("info")).length, 1);
    await spend(500, "food");
    assert.equal((await ofType("info")).length, 0);
    assert.equal((await ofType("budget_exceeded")).length, 1);
  });

  it("adds the 50 percent alert only in Everything", async () => {
    await budget("food", "food", 1000);
    await spend(600, "food");
    assert.equal((await ofType("info")).length, 0);

    await call("PUT", "/budgets/alert-settings", { mode: "everything", warnAt: 80, emails: true });
    await refresh();
    assert.equal((await ofType("info")).length, 1);
  });

  it("sends only Over alerts in Important, and nothing when a budget is off", async () => {
    await call("PUT", "/budgets/alert-settings", { mode: "important", warnAt: 80, emails: true });
    await budget("food", "food", 1000);
    await budget("quiet", "pets", 100, { alertMode: "off" });
    await spend(900, "food");
    await spend(200, "pets");
    assert.equal((await alerts()).length, 0);
    await spend(200, "food");
    assert.equal((await ofType("budget_exceeded")).length, 1);
  });

  it("clears itself when spending falls back under", async () => {
    await budget("food", "food", 1000);
    await spend(1200, "food");
    assert.equal((await ofType("budget_exceeded")).length, 1);
    await call("PATCH", `/budget/${await idOf("food")}/limit`, { amount: 2000, scope: "month" });
    assert.equal((await ofType("budget_exceeded")).length, 0);
  });

  it("can alert again after the limit is raised and passed", async () => {
    await budget("food", "food", 1000);
    await spend(1200, "food");
    await call("PATCH", `/budget/${await idOf("food")}/limit`, { amount: 2000, scope: "month" });
    await spend(1000, "food");
    assert.equal((await ofType("budget_exceeded")).length, 1);
  });

  it("emails an Over alert by default, but not a threshold", async () => {
    await budget("food", "food", 1000);
    await spend(900, "food");
    await flushBudgetEmails(user.id);
    assert.equal(mails.length, 0);
    await spend(300, "food");
    await flushBudgetEmails(user.id);
    assert.equal(mails.length, 1);
    assert.match(mails[0].text, /Food is KES 200 over/);
    assert.match(mails[0].text, /alerts=1/);
  });

  it("sends no email when emails are off", async () => {
    await call("PUT", "/budgets/alert-settings", { mode: "balanced", warnAt: 80, emails: false });
    await budget("food", "food", 100);
    await spend(300, "food");
    await flushBudgetEmails(user.id);
    assert.equal(mails.length, 0);
    assert.equal((await ofType("budget_exceeded")).length, 1);
  });

  it("holds emails overnight", () => {
    assert.equal(isQuietHour(new Date("2026-11-02T20:00:00Z")), true);
    assert.equal(isQuietHour(new Date("2026-11-02T03:30:00Z")), true);
    assert.equal(isQuietHour(new Date("2026-11-02T04:30:00Z")), false);
    assert.equal(isQuietHour(new Date("2026-11-02T17:30:00Z")), false);
  });

  it("sends a weekly summary", async () => {
    await budget("food", "food", 1000);
    await spend(250, "food");
    await sendWeeklyDigests(user.id);
    const digest = mails.find((mail) => mail.to === user.email);
    assert.equal(digest.subject, "Your budgets this week");
    assert.match(digest.text, /Food: KES 750 left of KES 1,000/);
  });

  it("doesn't repeat an alert after it has been read", async () => {
    await budget("travel", "travel", 100, { email: true });
    await spend(150, "travel");
    const [first] = (await alerts()).filter((row) => row.type === "budget_exceeded");
    assert.ok(first);
    const sent = mails.length;

    await call("PATCH", `/notifications/mark-as-read/${first.id}`);
    await refresh();
    await refresh();

    assert.equal((await alerts()).filter((row) => row.type === "budget_exceeded").length, 0);
    assert.equal(mails.length, sent);
  });
});
