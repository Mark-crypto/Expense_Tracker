import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  closeDatabase,
  connection,
  createUser,
  removeUsers,
  request,
  startServer,
} from "./helpers.js";

const today = new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Nairobi" });
const month = today.slice(0, 7);
const previousMonthDate = () => {
  const [year, number] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, number - 2, 1));
  return date.toISOString().split("T")[0];
};

describe("budgets", () => {
  let server, api, alice, bob;

  const budget = (user, name, category, amount, extra = {}) =>
    request(api, "POST", "/budget", {
      cookie: user.cookie,
      body: { name, category, amount, subcategories: [{ name: "Planned", amount }], ...extra },
    });
  const expense = (user, amount, category, date = today, extra = {}) =>
    request(api, "POST", "/expenses", {
      cookie: user.cookie,
      body: { amount, category, date, subcategories: [{ name: "Item", amount }], budgeted: false, ...extra },
    });
  const overview = async (user, query = "") =>
    (await request(api, "GET", `/budgets/overview${query}`, { cookie: user.cookie })).body;
  const find = async (user, name, query) =>
    (await overview(user, query)).budgets.find((row) => row.name === name);

  before(async () => {
    ({ server, api } = await startServer());
    alice = await createUser(api);
    bob = await createUser(api);
  });

  after(async () => {
    await removeUsers([alice, bob]);
    await closeDatabase();
    server.close();
  });

  it("tracks expenses by category without a manual link", async () => {
    await budget(alice, "food", "food", 1000);
    await expense(alice, 300, "food");
    assert.equal((await find(alice, "food")).spent, 300);
  });

  it("resets each month but keeps the history", async () => {
    await expense(alice, 200, "food", previousMonthDate());
    const food = await find(alice, "food");
    assert.equal(food.spent, 300);
    assert.equal(food.history.at(-1).spent, 300);
    assert.equal(food.history.at(-2).spent, 200);

    const past = await find(alice, "food", `?month=${previousMonthDate().slice(0, 7)}`);
    assert.equal(past.spent, 200);
  });

  it("allows one regular budget per category, with one-offs alongside", async () => {
    const clash = await budget(alice, "more food", "food", 1000);
    assert.equal(clash.status, 409);

    const trip = await budget(alice, "party", "food", 800, {
      period: "once",
      startDate: today,
      endDate: today,
    });
    assert.equal(trip.status, 201);
    await expense(alice, 50, "food");
    assert.equal((await find(alice, "party")).spent, 350);
    assert.equal((await find(alice, "food")).spent, 0);

    await expense(alice, 70, "food", today, { budgeted: true, budgetNames: "food" });
    assert.equal((await find(alice, "food")).spent, 70);

    const { budget_id: id } = await find(alice, "party");
    await request(api, "DELETE", `/budget/${id}`, { cookie: alice.cookie });
  });

  it("flags older overlapping budgets and won't resume into a clash", async () => {
    const [result] = await connection.execute(
      "INSERT INTO budget (name, category, amount, email_checked, user_id, subcategories) VALUES ('old food', 'food', 500, 'checked', ?, '[]')",
      [alice.id]
    );
    const { overlaps } = await overview(alice);
    assert.equal(overlaps[0].category, "food");
    assert.equal(overlaps[0].budgets.length, 2);

    await request(api, "PATCH", `/budget/${result.insertId}/status`, { cookie: alice.cookie, body: { paused: true } });
    assert.equal((await overview(alice)).overlaps.length, 0);
    const resumed = await request(api, "PATCH", `/budget/${result.insertId}/status`, { cookie: alice.cookie, body: { paused: false } });
    assert.equal(resumed.status, 409);
    await request(api, "DELETE", `/budget/${result.insertId}`, { cookie: alice.cookie });
  });

  it("creates a budget with no items and edits its details", async () => {
    const created = await request(api, "POST", "/budget", {
      cookie: alice.cookie,
      body: { name: "fun", category: "entertainment", amount: 2000 },
    });
    assert.equal(created.status, 201);
    const { budget_id: id } = await find(alice, "fun");

    const edited = await request(api, "PATCH", `/budget/${id}`, {
      cookie: alice.cookie,
      body: { name: "going out", category: "entertainment", subcategories: [{ name: "Movies", amount: 500 }], rollover: true },
    });
    assert.equal(edited.status, 200);
    const fun = await find(alice, "going out");
    assert.equal(fun.limit, 2000);
    assert.equal(fun.rollover, true);

    const stolen = await request(api, "PATCH", `/budget/${id}`, {
      cookie: bob.cookie,
      body: { name: "mine", category: "entertainment" },
    });
    assert.equal(stolen.status, 404);
    await request(api, "DELETE", `/budget/${id}`, { cookie: alice.cookie });
  });

  it("keeps past limits, and can change just this month", async () => {
    await budget(alice, "bills", "utilities", 1000);
    const { budget_id: id } = await find(alice, "bills");
    const lastMonth = previousMonthDate().slice(0, 7);
    await connection.execute("UPDATE budget_limits SET from_month = ? WHERE budget_id = ?", [lastMonth, id]);

    await request(api, "PATCH", `/budget/${id}/limit`, { cookie: alice.cookie, body: { amount: 1500, scope: "forward" } });
    assert.equal((await find(alice, "bills")).limit, 1500);
    assert.equal((await find(alice, "bills", `?month=${lastMonth}`)).limit, 1000);

    await request(api, "PATCH", `/budget/${id}/limit`, { cookie: alice.cookie, body: { amount: 1800, scope: "month" } });
    const now = await find(alice, "bills");
    assert.equal(now.limit, 1800);
    assert.equal(now.changes.length, 2);
    assert.equal(now.changes[0].scope, "month");
    assert.equal((await find(alice, "bills", `?month=${lastMonth}`)).limit, 1000);

    const [[{ amount }]] = await connection.execute("SELECT amount FROM budget WHERE budget_id = ?", [id]);
    assert.equal(Number(amount), 1500);
  });

  it("moves money between budgets, keeping the total", async () => {
    await budget(bob, "fun", "entertainment", 1000);
    await budget(bob, "eating", "food", 1000);
    await expense(bob, 300, "entertainment");
    const from = await find(bob, "fun");
    const to = await find(bob, "eating");
    const move = (amount) =>
      request(api, "POST", "/budgets/move", { cookie: bob.cookie, body: { fromId: from.budget_id, toId: to.budget_id, amount } });

    assert.equal((await move(900)).status, 400);
    assert.equal((await move(400)).status, 200);
    assert.equal((await find(bob, "fun")).limit, 600);
    assert.equal((await find(bob, "eating")).limit, 1400);
    assert.equal((await find(bob, "eating")).changes[0].scope, "move");

    assert.equal((await move(300)).status, 200);
    assert.equal((await find(bob, "fun")).limit, 300);
    assert.equal((await find(bob, "eating")).limit, 1700);
  });

  it("carries unused money into the next month when asked", async () => {
    await budget(bob, "kept", "clothing", 1000, { rollover: true });
    await budget(bob, "reset", "pets", 1000);
    const { budget_id: id } = await find(bob, "kept");
    const lastMonth = previousMonthDate().slice(0, 7);
    assert.equal((await find(bob, "kept")).carried, 0);

    await connection.execute("UPDATE budget_limits SET from_month = ? WHERE budget_id = ?", [lastMonth, id]);
    await expense(bob, 400, "clothing", previousMonthDate());
    const kept = await find(bob, "kept");
    assert.equal(kept.carried, 600);
    assert.equal(kept.limit, 1600);
    assert.equal((await find(bob, "reset")).carried, 0);
  });

  it("counts a weekly budget against the current week", async () => {
    await budget(bob, "matatu", "transportation", 700, { period: "weekly" });
    await expense(bob, 100, "transportation");
    await expense(bob, 200, "transportation", previousMonthDate());
    const weekly = await find(bob, "matatu");
    assert.equal(weekly.limit, 700);
    assert.equal(weekly.spent, 100);
    assert.ok(weekly.periodStart <= today && today <= weekly.periodEnd);

    const past = await find(bob, "matatu", `?month=${previousMonthDate().slice(0, 7)}`);
    assert.equal(past.spent, 200);
    assert.ok(past.limit > 2800);
  });

  it("shows tracked bills as already committed", async () => {
    await budget(bob, "home", "housing", 20000);
    const soon = new Date(Date.now() + 864e5).toLocaleDateString("en-CA", { timeZone: "Africa/Nairobi" });
    if (soon.slice(0, 7) === month) {
      await request(api, "POST", "/bills", {
        cookie: bob.cookie,
        body: { name: "Rent", category: "housing", amount: 18000, frequency: "monthly", nextDue: soon },
      });
      assert.equal((await find(bob, "home")).committed, 18000);
    }
  });

  it("builds a plan and saves it", async () => {
    const before = await request(api, "GET", "/budgets/plan", { cookie: alice.cookie });
    const food = before.body.rows.find((row) => row.category === "food");
    assert.ok(food.budgetId);
    assert.ok(food.suggested >= 0);

    const saved = await request(api, "POST", "/budgets/plan", {
      cookie: alice.cookie,
      body: {
        rows: [
          { category: "food", name: "food", amount: 4000 },
          { category: "taxes", name: "taxes & fees", amount: 900 },
        ],
      },
    });
    assert.equal(saved.status, 200);
    assert.equal((await find(alice, "food")).limit, 4000);
    assert.equal((await find(alice, "taxes & fees")).limit, 900);
  });

  it("leaves budgets that didn't exist yet out of the review", async () => {
    await budget(alice, "brand new", "pets", 500);
    const { review } = await overview(alice);
    assert.equal(review.rows.some((row) => row.name === "brand new"), false);
  });

  it("reviews last month with suggested limits", async () => {
    const { budget_id: id } = await find(alice, "food");
    await connection.execute("DELETE FROM budget_limits WHERE budget_id = ?", [id]);
    await connection.execute(
      "INSERT INTO budget_limits (budget_id, user_id, from_month, only_month, amount) VALUES (?, ?, ?, 0, 100)",
      [id, alice.id, previousMonthDate().slice(0, 7)]
    );
    const { review } = await overview(alice);
    const row = review.rows.find((item) => item.budget_id === id);
    assert.equal(row.over, true);
    assert.equal(row.suggestion, 200);
  });

  it("lists spending with no budget", async () => {
    await expense(alice, 900, "housing");
    const { unbudgeted } = await overview(alice);
    assert.deepEqual(unbudgeted, [{ category: "housing", total: 900 }]);
  });

  it("warns at 80 percent and alerts over the limit", async () => {
    await budget(bob, "travel", "travel", 100);
    const alerts = async () =>
      (await request(api, "GET", "/notifications", { cookie: bob.cookie })).body.data.filter((row) => row.message.startsWith("Travel"));

    await expense(bob, 85, "travel");
    let list = await alerts();
    assert.equal(list.length, 1);
    assert.equal(list[0].type, "info");

    await expense(bob, 30, "travel");
    list = await alerts();
    assert.equal(list.filter((row) => row.type === "budget_exceeded").length, 1);
    assert.equal((await find(bob, "travel")).status, "exceeded");
  });

  it("pauses a budget so it stops collecting expenses", async () => {
    await budget(bob, "gifts", "gifts", 500);
    const { budget_id: id } = await find(bob, "gifts");

    const blocked = await request(api, "PATCH", `/budget/${id}/status`, {
      cookie: alice.cookie,
      body: { paused: true },
    });
    assert.equal(blocked.status, 404);

    await request(api, "PATCH", `/budget/${id}/status`, { cookie: bob.cookie, body: { paused: true } });
    await expense(bob, 40, "gifts");
    assert.equal((await find(bob, "gifts")).spent, 0);

    await request(api, "PATCH", `/budget/${id}/status`, { cookie: bob.cookie, body: { paused: false } });
    assert.equal((await find(bob, "gifts")).spent, 40);
  });

  it("suggests a limit from recent spending", async () => {
    const res = await request(api, "GET", "/budgets/suggest?category=food", { cookie: alice.cookie });
    assert.equal(res.body.average, 200);
  });

  it("deleting a budget unlinks its expenses", async () => {
    const { budget_id: id } = await find(alice, "food");
    await request(api, "DELETE", `/budget/${id}`, { cookie: alice.cookie });
    const [[{ linked }]] = await connection.execute(
      "SELECT COUNT(*) AS linked FROM expense WHERE budget_id = ?",
      [id]
    );
    assert.equal(linked, 0);
  });

  it("only shows a user's own budgets", async () => {
    const data = await overview(alice, `?month=${month}`);
    assert.ok(data.budgets.every((row) => row.name !== "travel"));
  });
});
