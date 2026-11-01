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

describe("quick add", () => {
  let server, api, user;

  before(async () => {
    ({ server, api } = await startServer());
    user = await createUser(api);
  });

  after(async () => {
    await removeUsers([user]);
    server.close();
    await closeDatabase();
  });

  it("saves the merchant, remembers its category and suggests it next time", async () => {
    const today = new Date().toLocaleDateString("en-CA");
    const created = await request(api, "POST", "/expenses", {
      cookie: user.cookie,
      body: {
        amount: 450,
        category: "food",
        date: today,
        merchant: "Naivas",
        subcategories: [{ name: "Naivas", amount: 450 }],
      },
    });
    assert.equal(created.status, 201);

    await connection.execute(
      "INSERT INTO budget (name, category, amount, user_id, subcategories) VALUES ('Food', 'food', 1000, ?, '[]')",
      [user.id]
    );

    const { body } = await request(api, "GET", "/expenses/quick-add", { cookie: user.cookie });
    assert.deepEqual(body.merchants, [{ merchant: "Naivas", category: "food" }]);
    assert.equal(body.budgets.food.left, 550);

    const [suggestions] = await connection.execute(
      "SELECT 1 FROM subcategory_suggestions WHERE user_id = ? AND subcategory = 'Naivas'",
      [user.id]
    );
    assert.equal(suggestions.length, 0);
  });
});
