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

const iso = (days) => new Date(Date.now() - days * 86400000).toISOString().split("T")[0];

describe("expenses page", () => {
  let server, api, alice, bob;

  const add = (user, amount, name, category = "food", date = iso(1)) =>
    request(api, "POST", "/expenses", {
      cookie: user.cookie,
      body: { amount, category, date, subcategories: [{ name, amount }], budgeted: false },
    });
  const list = async (user, query = "") =>
    (await request(api, "GET", `/expenses?_limit=50${query}`, { cookie: user.cookie })).body;
  const bulk = (user, body) =>
    request(api, "POST", "/expenses/bulk", { cookie: user.cookie, body });

  before(async () => {
    ({ server, api } = await startServer());
    alice = await createUser(api);
    bob = await createUser(api);
    await add(alice, 300, "Naivas groceries");
    await add(alice, 700, "Naivas meat");
    await add(alice, 9000, "Laptop repair", "technology", iso(10));
    await connection.execute(
      "UPDATE expense SET merchant = 'NAIVAS', source = 'mpesa', needs_review = 1 WHERE user_id = ? AND category = 'food'",
      [alice.id]
    );
  });

  after(async () => {
    await removeUsers([alice, bob]);
    await closeDatabase();
    server.close();
  });

  it("filters and summarises what's on screen", async () => {
    const food = await list(alice, "&category=food");
    assert.equal(food.summary.count, 2);
    assert.equal(food.summary.total, 1000);
    assert.deepEqual(food.summary.byCategory, [{ category: "food", total: 1000 }]);
    assert.equal(food.summary.daily[0].total, 1000);

    const search = await list(alice, "&q=laptop");
    assert.equal(search.data.length, 1);
    assert.equal(search.summary.biggest.amount, 9000);

    assert.equal((await list(alice, "&view=review")).data.length, 2);
    assert.equal((await list(alice, "&view=large")).data.length, 1);
    assert.equal((await list(alice, "&source=mpesa")).data.length, 2);
    assert.equal((await list(alice, `&from=${iso(5)}&to=${iso(0)}`)).data.length, 2);
    assert.equal((await list(alice)).summary.toReview, 2);
    assert.equal((await list(alice, "&merchant=NAIVAS")).summary.count, 2);
    assert.equal((await list(alice, "&min=500")).summary.count, 2);
  });

  it("sorts by amount", async () => {
    const { data } = await list(alice, "&sort=amount&dir=desc");
    assert.equal(Number(data[0].amount), 9000);
  });

  it("edits an expense and clears it from review", async () => {
    const [expense] = (await list(alice, "&view=review")).data;
    const path = `/expenses/${expense.expense_id}`;
    const body = { amount: 350, category: "household", date: iso(2), merchant: "NAIVAS", note: "Weekly shop" };

    const blocked = await request(api, "PATCH", path, { cookie: bob.cookie, body });
    assert.equal(blocked.status, 404);

    const future = await request(api, "PATCH", path, {
      cookie: alice.cookie,
      body: { ...body, date: iso(-5) },
    });
    assert.equal(future.status, 400);

    const saved = await request(api, "PATCH", path, { cookie: alice.cookie, body });
    assert.equal(saved.status, 200);

    const updated = (await list(alice, "&q=Weekly")).data[0];
    assert.equal(Number(updated.amount), 350);
    assert.equal(updated.needs_review, 0);
    assert.match(updated.subcategories, /350/);
  });

  it("moves budget status both ways when an expense is edited", async () => {
    await request(api, "POST", "/budget", {
      cookie: bob.cookie,
      body: { name: "edit", category: "food", amount: 100, subcategories: [{ name: "x", amount: 100 }] },
    });
    const [[budget]] = await connection.execute("SELECT budget_id FROM budget WHERE user_id = ?", [bob.id]);
    await add(bob, 50, "Small", "food", iso(0));
    const [expense] = (await list(bob)).data;
    const edit = (amount) =>
      request(api, "PATCH", `/expenses/${expense.expense_id}`, {
        cookie: bob.cookie,
        body: { amount, category: "food", date: iso(0), budgetId: budget.budget_id },
      });
    const status = async () =>
      (await connection.execute("SELECT status FROM budget WHERE budget_id = ?", [budget.budget_id]))[0][0].status;

    await edit(500);
    assert.equal(await status(), "exceeded");
    await edit(50);
    assert.equal(await status(), "active");
  });

  it("applies bulk changes only to the user's own expenses, and restores deletes", async () => {
    const ids = (await list(alice)).data.map((row) => row.expense_id);

    await bulk(bob, { ids, action: "delete" });
    assert.equal((await list(alice)).summary.count, 3);

    await bulk(alice, { ids, action: "category", category: "gifts" });
    assert.equal((await list(alice, "&category=gifts")).summary.count, 3);

    await bulk(alice, { ids, action: "delete" });
    assert.equal((await list(alice)).summary.count, 0);

    await bulk(alice, { ids, action: "restore" });
    assert.equal((await list(alice)).summary.count, 3);

    assert.equal((await bulk(alice, { ids: [], action: "delete" })).status, 400);
    assert.equal((await bulk(alice, { ids, action: "nope" })).status, 400);
  });

  it("reports merchant history and applies a category to all of it", async () => {
    const stats = await request(api, "GET", "/expenses/merchant?name=NAIVAS", { cookie: alice.cookie });
    assert.equal(stats.body.count, 2);

    const applied = await request(api, "POST", "/expenses/apply-merchant", {
      cookie: alice.cookie,
      body: { merchant: "NAIVAS", category: "food" },
    });
    assert.equal(applied.body.updated, 2);
    assert.equal((await list(alice, "&category=food")).summary.count, 2);
  });
});
