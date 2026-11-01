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

const pad = (value) => String(value).padStart(2, "0");
const monthsAgo = (count, day) => {
  const date = new Date();
  date.setDate(1);
  date.setMonth(date.getMonth() - count);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(day)}`;
};

describe("forecast", () => {
  let server, api, alice, bob, fresh;

  const insert = (user, amount, category, date, merchant) =>
    connection.execute(
      `INSERT INTO expense (amount, category, date_created, month, user_id, subcategories, budgeted, merchant)
      VALUES (?, ?, ?, 'x', ?, '[]', 0, ?)`,
      [amount, category, date, user.id, merchant]
    );
  const forecast = async (user) =>
    (await request(api, "GET", "/forecast", { cookie: user.cookie })).body;

  before(async () => {
    ({ server, api } = await startServer());
    alice = await createUser(api);
    bob = await createUser(api);
    fresh = await createUser(api);

    for (const months of [1, 2, 3, 4]) {
      await insert(alice, 1000, "technology", monthsAgo(months, 27), "Netflix");
      await insert(alice, 9000, "emergency", monthsAgo(months, 26), `One off ${months}`);
      for (const day of [3, 10, 17, 24]) {
        await insert(alice, 2000, "food", monthsAgo(months, day), "Naivas");
      }
    }
    await request(api, "POST", "/budget", {
      cookie: alice.cookie,
      body: { name: "fun", category: "food", amount: 100, subcategories: [{ name: "x", amount: 100 }] },
    });
  });

  after(async () => {
    await connection.execute("DELETE FROM dismissed_bills WHERE user_id = ?", [alice.id]);
    await removeUsers([alice, bob, fresh]);
    await closeDatabase();
    server.close();
  });

  it("says when there is not enough history", async () => {
    const data = await forecast(fresh);
    assert.equal(data.enough, false);
    assert.equal(data.confidence, "low");
    assert.deepEqual(data.bills, []);
  });

  it("detects monthly bills but not weekly shopping", async () => {
    const { bills } = await forecast(alice);
    assert.deepEqual(bills.map(({ name }) => name), ["Netflix"]);
    assert.equal(bills[0].amount, 1000);
  });

  it("adds spent, bills and everyday spending into one total", async () => {
    const data = await forecast(alice);
    assert.equal(data.total, data.spent + data.stillToCome + data.likelyExtra);
    assert.ok(data.low <= data.total && data.high >= data.total);
    assert.equal(data.curve.at(-1).forecast ?? data.curve.at(-1).actual, data.total);
  });

  it("leaves rare large payments out of the daily rate", async () => {
    const data = await forecast(alice);
    const emergency = data.whatIf.find((row) => row.category === "emergency");
    assert.equal(emergency, undefined);
  });

  it("flags a budget heading over its limit", async () => {
    const { outlook } = await forecast(alice);
    assert.ok(outlook.find((row) => row.name === "fun").over > 0);
  });

  it("lets a user dismiss a bill and bring it back", async () => {
    const body = { key: "netflix" };
    await request(api, "POST", "/forecast/bills/dismiss", { cookie: alice.cookie, body });
    const dismissed = await forecast(alice);
    assert.equal(dismissed.bills.length, 0);
    assert.deepEqual(dismissed.dismissedBills, ["netflix"]);

    await request(api, "POST", "/forecast/bills/restore", { cookie: alice.cookie, body });
    assert.equal((await forecast(alice)).bills.length, 1);
  });

  it("keeps each user's forecast separate", async () => {
    const data = await forecast(bob);
    assert.equal(data.spent, 0);
    assert.deepEqual(data.bills, []);
  });
});
