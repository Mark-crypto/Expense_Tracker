import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import ExcelJS from "exceljs";
import { closeDatabase, connection, createUser, removeUsers, request, startServer } from "./helpers.js";
import { maskPhones } from "../utils/maskPhones.js";

describe("your data and privacy", () => {
  let server, api, user;
  const call = (method, path, body, cookie = user.cookie) => request(api, method, path, { cookie, body });
  const row = (receiptNo, details, counterparty, withdrawn) => ({
    receiptNo,
    occurredAt: "2026-10-20 12:00:00",
    details,
    kind: "send",
    counterparty,
    category: "family",
    paidIn: 0,
    withdrawn,
    save: true,
  });
  const download = async (cookie = user.cookie) =>
    fetch(`${api}/security/export`, { headers: { cookie } });

  before(async () => {
    ({ server, api } = await startServer());
    user = await createUser(api);
  });

  after(async () => {
    await removeUsers([user]);
    server.close();
    await closeDatabase();
  });

  it("keeps only the last 3 digits of phone numbers", () => {
    assert.equal(maskPhones("Customer Transfer to - 0712345678 JOHN DOE"), "Customer Transfer to - 07•• ••• 678 JOHN DOE");
    assert.equal(maskPhones("Funds received from - 254712***678 MARY"), "Funds received from - 07•• ••• 678 MARY");
    assert.equal(maskPhones("Pay Bill to 888880 - KPLC PREPAID Acc. 54405123456"), "Pay Bill to 888880 - KPLC PREPAID Acc. 54405123456");
    assert.equal(maskPhones(null), null);
  });

  it("needs the privacy policy accepted to sign up, and records when", async () => {
    const body = { name: "no consent", email: `nc-${Date.now()}@example.com`, password: "TestPass123!", confirmPassword: "TestPass123!", goal: "x", age: 30, occupation: "x" };
    const refused = await request(api, "POST", "/auth/signup", { body });
    assert.equal(refused.status, 400);
    const [[saved]] = await connection.execute("SELECT policy_accepted_at FROM users WHERE user_id = ?", [user.id]);
    assert.ok(Number(saved.policy_accepted_at) > Date.now() - 60 * 60 * 1000);
  });

  it("never stores a full phone number from a statement", async () => {
    await call("POST", "/mpesa/save", {
      transactions: [row("TK11AA11AA", "Customer Transfer to - 0712345678 JOHN DOE", "0712345678 JOHN DOE", 500)],
    });
    const [[saved]] = await connection.execute("SELECT details, counterparty FROM mpesa_transactions WHERE receipt_no = 'TK11AA11AA'");
    assert.equal(saved.counterparty, "07•• ••• 678 JOHN DOE");
    const [[expense]] = await connection.execute("SELECT merchant FROM expense WHERE receipt_no = 'TK11AA11AA'");
    assert.equal(expense.merchant, "07•• ••• 678 JOHN DOE");
  });

  it("downloads everything as one Excel file, behind the PIN once one is set", async () => {
    const res = await download();
    assert.equal(res.status, 200);
    assert.match(res.headers.get("content-disposition"), /expense-tracker-data-\d{4}-\d{2}-\d{2}\.xlsx/);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(Buffer.from(await res.arrayBuffer()));
    assert.deepEqual(
      workbook.worksheets.map((sheet) => sheet.name),
      ["Profile", "Expenses", "M-Pesa transactions", "Budgets", "Bills", "Accounts", "Money in", "Moves", "Goals", "Goal money"]
    );
    assert.equal(workbook.getWorksheet("M-Pesa transactions").getCell("E2").value, "07•• ••• 678 JOHN DOE");
    assert.equal(workbook.getWorksheet("Profile").getCell("B2").value, user.email);
    const text = JSON.stringify(workbook.worksheets.map((sheet) => sheet.getSheetValues()));
    assert.ok(!text.includes("$2"), "no password hashes");

    const set = await call("POST", "/security/pin", { pin: "4826" });
    assert.equal(set.status, 200);
    assert.equal((await download()).status, 423);
  });

  it("removes statement data, keeping expenses or not", async () => {
    const unlock = (res) => `${user.cookie}; ${res.headers.getSetCookie().find((value) => value.startsWith("pinUnlock=")).split(";")[0]}`;
    const cookie = unlock(await call("POST", "/security/pin/verify", { pin: "4826" }));
    const expenses = async () => {
      const [[{ count }]] = await connection.execute("SELECT COUNT(*) AS count FROM expense WHERE user_id = ? AND source = 'mpesa'", [user.id]);
      return Number(count);
    };

    assert.equal((await call("POST", "/security/delete-statement-data", { keepExpenses: true })).status, 423);
    const kept = await call("POST", "/security/delete-statement-data", { keepExpenses: true }, cookie);
    assert.equal(kept.body.message, "Removed 1 M-Pesa transaction. Your expenses stay.");
    assert.equal(await expenses(), 1);

    await call("POST", "/mpesa/save", { transactions: [row("TK22BB22BB", "Customer Transfer to - 0722000111 MARY", "0722000111 MARY", 300)] }, cookie);
    const both = await call("POST", "/security/delete-statement-data", { keepExpenses: false }, cookie);
    assert.equal(both.body.message, "Removed 1 M-Pesa transaction and 2 expenses they created.");
    assert.equal(await expenses(), 0);
    const [[{ remaining }]] = await connection.execute("SELECT COUNT(*) AS remaining FROM mpesa_transactions WHERE user_id = ?", [user.id]);
    assert.equal(Number(remaining), 0);
  });
});
