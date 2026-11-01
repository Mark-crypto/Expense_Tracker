import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  closeDatabase,
  createUser,
  removeUsers,
  request,
  startServer,
} from "./helpers.js";

const today = new Date().toISOString().split("T")[0];

describe("dashboard overview", () => {
  let server, api, alice, bob;

  before(async () => {
    ({ server, api } = await startServer());
    alice = await createUser(api);
    bob = await createUser(api);
    await request(api, "POST", "/budget", {
      cookie: alice.cookie,
      body: {
        name: "food",
        category: "food",
        amount: 100,
        subcategories: [{ name: "Groceries", amount: 100 }],
      },
    });
    await request(api, "POST", "/expenses", {
      cookie: alice.cookie,
      body: {
        amount: 150,
        category: "food",
        date: today,
        subcategories: [{ name: "Milk", amount: 150 }],
        budgeted: true,
        budgetNames: "food",
      },
    });
  });

  after(async () => {
    await removeUsers([alice, bob]);
    await closeDatabase();
    server.close();
  });

  const overview = async (user) =>
    (await request(api, "GET", "/dashboard/overview", { cookie: user.cookie })).body;

  it("returns expenses and budget spending", async () => {
    const data = await overview(alice);

    assert.equal(data.expenses.length, 1);
    assert.equal(data.expenses[0].date, today);
    assert.match(data.expenses[0].subcategories, /Milk/);
    assert.equal(data.budgets[0].spent, 150);
    assert.equal(data.budgets[0].status, "exceeded");
  });

  it("shows nothing from other users", async () => {
    const data = await overview(bob);
    assert.deepEqual(data.expenses, []);
    assert.deepEqual(data.budgets, []);
  });

  it("raises a limit, restores the budget and clears its alert", async () => {
    const { budgets } = await overview(alice);
    const path = `/budget/${budgets[0].budget_id}/limit`;

    const blocked = await request(api, "PATCH", path, {
      cookie: bob.cookie,
      body: { amount: 500 },
    });
    assert.equal(blocked.status, 404);

    const invalid = await request(api, "PATCH", path, {
      cookie: alice.cookie,
      body: { amount: -5 },
    });
    assert.equal(invalid.status, 400);

    const raised = await request(api, "PATCH", path, {
      cookie: alice.cookie,
      body: { amount: 200 },
    });
    assert.equal(raised.status, 200);

    const after = await overview(alice);
    assert.equal(after.budgets[0].limit, 200);
    assert.equal(after.budgets[0].status, "active");
    const alerts = await request(api, "GET", "/notifications", { cookie: alice.cookie });
    assert.equal(alerts.body.data.length, 0);
  });
});
