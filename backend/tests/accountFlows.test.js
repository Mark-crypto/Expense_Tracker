import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  closeDatabase,
  connection,
  createUser,
  mails,
  removeUsers,
  request,
  startServer,
} from "./helpers.js";

const iso = (date) => date.toISOString().split("T")[0];
const today = iso(new Date());
const daysFromNow = (days) => iso(new Date(Date.now() + days * 86400000));
const items = (amount) => [{ name: "Item", amount }];

describe("account and budget flows", () => {
  let server, api, user;

  const addExpense = (overrides = {}) =>
    request(api, "POST", "/expenses", {
      cookie: user.cookie,
      body: {
        amount: 100,
        category: "food",
        date: today,
        subcategories: items(100),
        budgeted: false,
        ...overrides,
      },
    });

  before(async () => {
    ({ server, api } = await startServer());
    user = await createUser(api);
  });

  after(async () => {
    await removeUsers([user]);
    await closeDatabase();
    server.close();
  });

  it("accepts past dates and rejects future dates", async () => {
    assert.equal((await addExpense({ date: "2024-01-15" })).status, 201);
    assert.equal((await addExpense()).status, 201);

    const future = await addExpense({ date: daysFromNow(5) });
    assert.equal(future.status, 400);
    assert.match(future.body.message, /future/);
  });

  it("rejects negative amounts and missing items", async () => {
    assert.equal((await addExpense({ amount: -50 })).status, 400);
    assert.equal((await addExpense({ subcategories: [] })).status, 400);
    assert.equal((await addExpense({ subcategories: items(-5) })).status, 400);
  });

  it("rejects a budget that ends before it starts", async () => {
    const res = await request(api, "POST", "/budget", {
      cookie: user.cookie,
      body: {
        name: "bad dates",
        category: "food",
        amount: 100,
        subcategories: items(100),
        startDate: "2026-12-10",
        endDate: "2026-12-01",
      },
    });
    assert.equal(res.status, 400);
  });

  it("rejects future dates in uploaded transactions", async () => {
    const res = await request(api, "POST", "/mpesa/save", {
      cookie: user.cookie,
      body: {
        transactions: [
          {
            receiptNo: "UAB12CD34X",
            occurredAt: `${daysFromNow(5)} 10:00:00`,
            details: "Pay Bill Online",
            kind: "paybill",
            paidIn: 0,
            withdrawn: 10,
            category: "utilities",
          },
        ],
      },
    });
    assert.equal(res.status, 400);
  });

  it("keeps monthly bars to the last 12 months", async () => {
    await addExpense({ date: daysFromNow(-500) });
    const { body } = await request(api, "GET", "/dashboard", { cookie: user.cookie });
    const label = new Date(Date.now() - 500 * 86400000).toLocaleString("en-GB", {
      month: "short",
      year: "2-digit",
    });

    assert.ok(!body.monthlySum.some(({ month }) => month === label));
    assert.equal(new Set(body.monthlySum.map(({ month }) => month)).size, body.monthlySum.length);
  });

  it("raises a budget alert and clears it when the expense is removed", async () => {
    await request(api, "POST", "/budget", {
      cookie: user.cookie,
      body: { name: "alerts", category: "food", amount: 100, subcategories: items(100) },
    });
    await addExpense({
      amount: 250,
      subcategories: items(250),
      budgeted: true,
      budgetNames: "alerts",
    });

    const budgetStatus = async () => {
      const [[row]] = await connection.execute(
        "SELECT status FROM budget WHERE user_id = ? AND name = 'alerts'",
        [user.id]
      );
      return row.status;
    };
    const alerts = async () =>
      (await request(api, "GET", "/notifications", { cookie: user.cookie })).body.data;

    assert.equal(await budgetStatus(), "exceeded");
    assert.equal((await alerts()).filter((row) => row.type === "budget_exceeded").length, 1);

    const [[expense]] = await connection.execute(
      "SELECT expense_id FROM expense WHERE user_id = ? AND budget_id IS NOT NULL",
      [user.id]
    );
    await request(api, "DELETE", `/expenses/${expense.expense_id}`, { cookie: user.cookie });

    assert.equal(await budgetStatus(), "active");
    assert.equal((await alerts()).filter((row) => row.type === "budget_exceeded").length, 0);
  });

  it("resets a password through the emailed link, once only", async () => {
    await request(api, "POST", "/auth/forgot-password", { body: { email: user.email } });
    const link = mails.at(-1).text.match(/https?:\S+/)[0];
    const token = new URL(link).searchParams.get("token");
    const password = "BrandNewPass456!";
    const reset = () =>
      request(api, "POST", "/auth/reset-password", {
        body: { token, password, confirmPassword: password },
      });

    assert.equal((await reset()).status, 200);
    assert.equal((await reset()).status, 400);
    const login = await request(api, "POST", "/auth/login", {
      body: { email: user.email, password },
    });
    assert.equal(login.status, 200);
  });

  it("deletes an account and everything that belongs to it", async () => {
    const leaving = await createUser(api);
    await request(api, "POST", "/expenses", {
      cookie: leaving.cookie,
      body: {
        amount: 50,
        category: "food",
        date: today,
        subcategories: [{ name: `Private ${leaving.id}`, amount: 50 }],
        budgeted: false,
      },
    });
    await request(api, "POST", "/budget", {
      cookie: leaving.cookie,
      body: { name: "mine", category: "food", amount: 50, subcategories: items(50) },
    });

    const res = await request(api, "DELETE", `/profile/${leaving.id}`, {
      cookie: leaving.cookie,
    });
    assert.equal(res.status, 200);

    for (const table of [
      "users",
      "expense",
      "budget",
      "notifications",
      "refresh_tokens",
      "subcategory_suggestions",
      "mpesa_transactions",
      "merchant_categories",
    ]) {
      const [[{ total }]] = await connection.execute(
        `SELECT COUNT(*) AS total FROM ${table} WHERE user_id = ?`,
        [leaving.id]
      );
      assert.equal(total, 0, table);
    }
  });
});
