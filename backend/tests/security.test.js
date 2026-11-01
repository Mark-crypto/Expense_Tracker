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

const item = (name, amount) => [{ name, amount }];
const today = new Date().toISOString().split("T")[0];

describe("access between users", () => {
  let server, api, alice, bob;

  const addExpense = (user, amount, name = "Milk") =>
    request(api, "POST", "/expenses", {
      cookie: user.cookie,
      body: {
        amount,
        category: "food",
        date: today,
        subcategories: item(name, amount),
        budgeted: false,
      },
    });

  const listExpenses = async (user) =>
    (await request(api, "GET", "/expenses", { cookie: user.cookie })).body;

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

  it("rejects requests without a login", async () => {
    const res = await request(api, "GET", "/expenses");
    assert.equal(res.status, 401);
  });

  it("lets users read their own profile only", async () => {
    const own = await request(api, "GET", `/profile/${alice.id}`, {
      cookie: alice.cookie,
    });
    const other = await request(api, "GET", `/profile/${bob.id}`, {
      cookie: alice.cookie,
    });
    assert.equal(own.status, 200);
    assert.equal(other.status, 403);
  });

  it("blocks editing or deleting another user's profile", async () => {
    const edit = await request(api, "PUT", `/profile/${bob.id}/edit-form`, {
      cookie: alice.cookie,
      body: { name: "hacked", occupation: "x", age: 1, goal: "x" },
    });
    const remove = await request(api, "DELETE", `/profile/${bob.id}`, {
      cookie: alice.cookie,
    });
    const [[bobRow]] = await connection.execute(
      "SELECT name FROM users WHERE user_id = ?",
      [bob.id]
    );
    assert.equal(edit.status, 403);
    assert.equal(remove.status, 403);
    assert.equal(bobRow.name, "test user");
  });

  it("keeps the admin dashboard from normal users", async () => {
    const res = await request(api, "GET", "/admin-dashboard", {
      cookie: alice.cookie,
    });
    assert.equal(res.status, 403);
    assert.equal(res.body.data, undefined);
  });

  it("doesn't return other users' budgets in search", async () => {
    const name = `private-${alice.id}`;
    await request(api, "POST", "/budget", {
      cookie: alice.cookie,
      body: {
        name,
        category: "food",
        amount: 100,
        email: false,
        subcategories: item("Groceries", 100),
      },
    });
    const own = await request(api, "GET", `/budgets/search?q=${name}`, {
      cookie: alice.cookie,
    });
    const other = await request(api, "GET", `/budgets/search?q=${name}`, {
      cookie: bob.cookie,
    });
    assert.equal(own.body.data.length, 1);
    assert.equal(other.body.data.length, 0);
  });

  it("blocks acting on another user's notification", async () => {
    const [result] = await connection.execute(
      "INSERT INTO notifications (user_id, type, message) VALUES (?, 'system', 'test')",
      [bob.id]
    );
    const res = await request(
      api,
      "POST",
      `/notifications/action/${result.insertId}`,
      { cookie: alice.cookie, body: { action: "keep-active" } }
    );
    assert.equal(res.status, 404);
  });

  it("deletes one expense without touching others or other users", async () => {
    await addExpense(alice, 100);
    await addExpense(alice, 200);
    const [first] = (await listExpenses(alice)).data;

    const blocked = await request(api, "DELETE", `/expenses/${first.expense_id}`, {
      cookie: bob.cookie,
    });
    assert.equal(blocked.status, 404);
    assert.equal((await listExpenses(alice)).meta.total, 2);

    const removed = await request(api, "DELETE", `/expenses/${first.expense_id}`, {
      cookie: alice.cookie,
    });
    assert.equal(removed.status, 200);
    assert.equal((await listExpenses(alice)).meta.total, 1);
  });

  it("leaves cleared expenses out of the list and totals", async () => {
    await addExpense(bob, 500);
    const cleared = await request(api, "PUT", "/expenses", { cookie: bob.cookie });
    assert.equal(cleared.status, 200);

    const list = await listExpenses(bob);
    const dashboard = await request(api, "GET", "/dashboard", { cookie: bob.cookie });
    const forecast = await request(api, "GET", "/forecast", { cookie: bob.cookie });

    assert.equal(list.meta.total, 0);
    assert.equal(dashboard.body.allCategories.length, 0);
    assert.equal(forecast.body.spent, 0);
  });

  it("keeps typed item names private to that user", async () => {
    const secret = `Rent to landlord ${alice.id}`;
    await addExpense(alice, 300, secret);
    const path = `/subcategory-suggestions?category=food&search=${encodeURIComponent(secret)}`;

    const own = await request(api, "GET", path, { cookie: alice.cookie });
    const other = await request(api, "GET", path, { cookie: bob.cookie });

    assert.deepEqual(own.body, [secret]);
    assert.deepEqual(other.body, []);
  });
});
