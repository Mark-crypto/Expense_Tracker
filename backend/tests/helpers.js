import crypto from "node:crypto";
import nodemailer from "nodemailer";
import app from "../app.js";
import connection from "../database.js";

// Tests must never send real email.
export const mails = [];
nodemailer.createTransport = () => ({
  sendMail: async (mail) => {
    mails.push(mail);
    return { messageId: "test" };
  },
});

export const startServer = () =>
  new Promise((resolve) => {
    const server = app.listen(0, () => {
      resolve({ server, api: `http://127.0.0.1:${server.address().port}/api` });
    });
  });

export const request = async (api, method, path, { body, cookie } = {}) => {
  const res = await fetch(api + path, {
    method,
    headers: {
      "content-type": "application/json",
      ...(cookie ? { cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => null);
  return { status: res.status, body: json, headers: res.headers };
};

export const createUser = async (api) => {
  const email = `test-${crypto.randomUUID()}@example.com`;
  const password = "TestPass123!";
  await request(api, "POST", "/auth/signup", {
    body: {
      name: "test user",
      email,
      password,
      confirmPassword: password,
      goal: "Testing",
      age: 30,
      occupation: "Tester",
      acceptPolicy: true,
    },
  });
  const login = await request(api, "POST", "/auth/login", {
    body: { email, password },
  });
  const cookie = login.headers
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; ");
  return { id: login.body.user.id, cookie, email };
};

export const removeUsers = async (users) => {
  for (const { id } of users) {
    for (const table of [
      "refresh_tokens",
      "notifications",
      "expense",
      "budget",
      "subcategory_suggestions",
      "mpesa_transactions",
      "merchant_categories",
      "dismissed_bills",
      "recurring_payments",
      "recurring_price_changes",
      "bill_aliases",
      "budget_limits",
      "budget_changes",
      "budget_alerts",
      "account_balances",
      "account_income",
      "account_transfers",
      "accounts",
      "expense_shortcuts",
      "goal_moves",
      "savings_goals",
      "users",
    ]) {
      await connection.execute(`DELETE FROM ${table} WHERE user_id = ?`, [id]);
    }
  }
};

export const closeDatabase = () => connection.end();
export { connection };
