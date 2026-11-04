import { after, before, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { closeDatabase, connection, createUser, removeUsers, request, startServer } from "./helpers.js";
import { addDays, today } from "../utils/dates.js";

describe("savings goals", () => {
  let server, api, user, other;
  const call = (method, path, body, who = user) => request(api, method, path, { cookie: who.cookie, body });
  const goals = async () => (await call("GET", "/goals")).body.goals;
  const goalNamed = async (name) => (await goals()).find((goal) => goal.name === name);
  const addGoal = async (body) => (await call("POST", "/goals", body)).body.id;
  const addAccount = async (name, type, balance, spendable = true) =>
    (await call("POST", "/accounts", { name, type, balance, spendable })).body.id;

  before(async () => {
    ({ server, api } = await startServer());
    user = await createUser(api);
    other = await createUser(api);
  });

  beforeEach(async () => {
    for (const table of ["notifications", "goal_moves", "savings_goals", "account_balances", "account_transfers", "accounts"]) {
      await connection.execute(`DELETE FROM ${table} WHERE user_id = ?`, [user.id]);
    }
    await connection.execute("UPDATE users SET pay_type = 'irregular', pay_day = NULL, safety_buffer = 0 WHERE user_id = ?", [user.id]);
  });

  after(async () => {
    await removeUsers([user, other]);
    server.close();
    await closeDatabase();
  });

  it("works out the weekly amount and keeps goal money out of Safe to spend", async () => {
    await addAccount("M-Pesa", "mpesa", 50000);
    await addGoal({ name: "School fees", target: 45000, dueDate: addDays(today(), 70), saved: 5000 });

    const goal = await goalNamed("School fees");
    assert.equal(goal.saved, 5000);
    assert.equal(goal.weekly, 4000);
    assert.equal(goal.state, "on_track");
    assert.equal(goal.keptBack, true);

    // Saved money plus the share of what's still needed over the next 30 days.
    const { safeToSpend } = (await call("GET", "/dashboard/overview")).body;
    assert.equal(safeToSpend.goals, Math.round(5000 + (40000 * 30) / 70));
    assert.equal(safeToSpend.pool, 50000 - safeToSpend.goals);
  });

  it("records money set aside and taken out, but not more than was saved", async () => {
    const id = await addGoal({ name: "Emergency fund", target: 30000 });
    assert.equal((await call("POST", `/goals/${id}/money`, { amount: 2500, direction: "add" })).status, 201);
    assert.equal((await call("POST", `/goals/${id}/money`, { amount: 1000, direction: "take" })).status, 201);
    assert.equal((await call("POST", `/goals/${id}/money`, { amount: 5000, direction: "take" })).status, 400);

    const goal = await goalNamed("Emergency fund");
    assert.equal(goal.saved, 1500);
    assert.equal(goal.weekly, null);
    assert.equal(goal.state, "open");
  });

  it("fills goals kept in one account nearest date first, and leaves them out of Safe to spend", async () => {
    await addAccount("M-Pesa", "mpesa", 10000);
    const savings = await addAccount("Sacco", "savings", 30000, false);
    await addGoal({ name: "Rent deposit", target: 20000, dueDate: addDays(today(), 30), accountId: savings });
    await addGoal({ name: "Laptop", target: 50000, dueDate: addDays(today(), 200), accountId: savings });

    assert.equal((await goalNamed("Rent deposit")).saved, 20000);
    assert.equal((await goalNamed("Rent deposit")).state, "reached");
    assert.equal((await goalNamed("Laptop")).saved, 10000);
    assert.equal((await goalNamed("Laptop")).state, "on_track");
    assert.equal((await call("GET", "/dashboard/overview")).body.safeToSpend.goals, 0);

    const laptop = await goalNamed("Laptop");
    assert.equal((await call("POST", `/goals/${laptop.id}/money`, { amount: 100, direction: "add" })).status, 400);
  });

  it("keeps a goal's progress when its account is removed", async () => {
    const savings = await addAccount("Sacco", "savings", 8000, false);
    await addGoal({ name: "Holiday", target: 20000, accountId: savings });
    await call("DELETE", `/accounts/${savings}`);

    const goal = await goalNamed("Holiday");
    assert.equal(goal.saved, 8000);
    assert.equal(goal.accountId, null);
  });

  it("says when a goal falls behind, with one note every two weeks", async () => {
    const id = await addGoal({ name: "Car service", target: 14000, dueDate: addDays(today(), 28) });
    await connection.execute("UPDATE savings_goals SET started_on = ? WHERE id = ?", [addDays(today(), -28), id]);

    const goal = await goalNamed("Car service");
    assert.equal(goal.state, "behind");
    assert.equal(goal.weekly, 3500);
    await goals();
    const [notes] = await connection.execute("SELECT message FROM notifications WHERE user_id = ? AND type = 'goal'", [user.id]);
    assert.equal(notes.length, 1);
    assert.match(notes[0].message, /Car service is behind\. Put aside KES 3,500 a week/);
  });

  it("restarts the plan when the target or date changes", async () => {
    const id = await addGoal({ name: "Phone", target: 14000, dueDate: addDays(today(), 28) });
    await connection.execute("UPDATE savings_goals SET started_on = ? WHERE id = ?", [addDays(today(), -28), id]);
    assert.equal((await goalNamed("Phone")).state, "behind");

    await call("PATCH", `/goals/${id}`, { name: "Phone", target: 14000, dueDate: addDays(today(), 56) });
    assert.equal((await goalNamed("Phone")).state, "on_track");
  });

  it("archives a goal, and refuses bad dates and other people's goals", async () => {
    const id = await addGoal({ name: "Shoes", target: 3000 });
    assert.equal((await call("POST", "/goals", { name: "Late", target: 100, dueDate: today() })).status, 400);
    assert.equal((await call("POST", `/goals/${id}/money`, { amount: 10, direction: "add" }, other)).status, 404);
    assert.equal((await call("DELETE", `/goals/${id}`, undefined, other)).status, 404);

    await call("POST", `/goals/${id}/archive`);
    assert.equal((await goals()).length, 0);
  });
});
