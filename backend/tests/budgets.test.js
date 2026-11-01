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

const today = new Date().toISOString().split("T")[0];
const month = today.slice(0, 7);
const previousMonthDate = () => {
  const date = new Date();
  date.setDate(1);
  date.setMonth(date.getMonth() - 1);
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

  it("gives expenses to the newest budget, and a manual link overrides that", async () => {
    await budget(alice, "newer food", "food", 1000);
    await expense(alice, 50, "food");
    assert.equal((await find(alice, "newer food")).spent, 350);
    assert.equal((await find(alice, "food")).spent, 0);

    await expense(alice, 70, "food", today, { budgeted: true, budgetNames: "food" });
    assert.equal((await find(alice, "food")).spent, 70);
    assert.equal((await find(alice, "newer food")).spent, 350);
  });

  it("lists spending with no budget", async () => {
    await expense(alice, 900, "housing");
    const { unbudgeted } = await overview(alice);
    assert.deepEqual(unbudgeted, [{ category: "housing", total: 900 }]);
  });

  it("warns at 80 percent and alerts over the limit", async () => {
    await budget(bob, "travel", "travel", 100);
    const alerts = async () =>
      (await request(api, "GET", "/notifications", { cookie: bob.cookie })).body.data;

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
    assert.ok(res.body.average > 0);
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
