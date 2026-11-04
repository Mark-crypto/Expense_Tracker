import ExcelJS from "exceljs";
import connection from "../database.js";
import { loadAccounts } from "../utils/accounts.js";
import { refreshUserBudgets } from "../utils/budgetStatus.js";
import { today } from "../utils/dates.js";

const fail = (res, message, error) => {
  console.error(message, error);
  res.status(500).json({ error: true, message });
};

const userIdOf = (req) => parseInt(req.user.userId);

// Column headings come from the query's own names, so each sheet reads like the app.
const SHEETS = [
  [
    "Profile",
    `SELECT name AS \`Name\`, email AS \`Email\`, occupation AS \`Occupation\`, age AS \`Age\`, goal AS \`Money goal\`,
      DATE_FORMAT(created_at, '%Y-%m-%d') AS \`Joined\`
    FROM users WHERE user_id = ?`,
  ],
  [
    "Expenses",
    `SELECT DATE_FORMAT(e.date_created, '%Y-%m-%d') AS \`Date\`, e.amount AS \`Amount (KES)\`, e.category AS \`Category\`,
      e.merchant AS \`Paid to\`, e.description AS \`Details\`, e.note AS \`Note\`, a.name AS \`Paid from\`,
      e.source AS \`Added by\`, e.receipt_no AS \`Receipt\`, e.status AS \`Status\`
    FROM expense e LEFT JOIN accounts a ON a.id = e.account_id
    WHERE e.user_id = ? ORDER BY e.date_created DESC, e.expense_id DESC`,
  ],
  [
    "M-Pesa transactions",
    `SELECT DATE_FORMAT(occurred_at, '%Y-%m-%d %H:%i') AS \`Time\`, receipt_no AS \`Receipt\`, details AS \`Details\`,
      kind AS \`Type\`, counterparty AS \`Who\`, paid_in AS \`Paid in (KES)\`, withdrawn AS \`Withdrawn (KES)\`,
      balance AS \`Balance (KES)\`
    FROM mpesa_transactions WHERE user_id = ? ORDER BY occurred_at DESC`,
  ],
  [
    "Budgets",
    `SELECT name AS \`Name\`, category AS \`Category\`, amount AS \`Limit (KES)\`, period AS \`Period\`, status AS \`Status\`,
      DATE_FORMAT(start_date, '%Y-%m-%d') AS \`Starts\`, DATE_FORMAT(end_date, '%Y-%m-%d') AS \`Ends\`
    FROM budget WHERE user_id = ? ORDER BY name`,
  ],
  [
    "Bills",
    `SELECT name AS \`Name\`, kind AS \`Type\`, category AS \`Category\`, amount AS \`Amount (KES)\`, frequency AS \`How often\`,
      DATE_FORMAT(next_due, '%Y-%m-%d') AS \`Next due\`, status AS \`Status\`
    FROM recurring_payments WHERE user_id = ? ORDER BY name`,
  ],
  [
    "Money in",
    `SELECT DATE_FORMAT(i.received_on, '%Y-%m-%d') AS \`Date\`, i.name AS \`From\`, a.name AS \`Into\`, i.amount AS \`Amount (KES)\`
    FROM account_income i LEFT JOIN accounts a ON a.id = i.account_id
    WHERE i.user_id = ? ORDER BY i.received_on DESC`,
  ],
  [
    "Moves",
    `SELECT DATE_FORMAT(t.moved_on, '%Y-%m-%d') AS \`Date\`, f.name AS \`From\`, d.name AS \`To\`, t.amount AS \`Amount (KES)\`
    FROM account_transfers t LEFT JOIN accounts f ON f.id = t.from_account_id LEFT JOIN accounts d ON d.id = t.to_account_id
    WHERE t.user_id = ? ORDER BY t.moved_on DESC`,
  ],
  [
    "Goals",
    `SELECT g.name AS \`Goal\`, g.target AS \`Target (KES)\`, DATE_FORMAT(g.due_date, '%Y-%m-%d') AS \`By\`,
      a.name AS \`Kept in\`, g.status AS \`Status\`
    FROM savings_goals g LEFT JOIN accounts a ON a.id = g.account_id
    WHERE g.user_id = ? ORDER BY g.id`,
  ],
  [
    "Goal money",
    `SELECT DATE_FORMAT(m.moved_on, '%Y-%m-%d') AS \`Date\`, g.name AS \`Goal\`, m.amount AS \`Amount (KES)\`
    FROM goal_moves m JOIN savings_goals g ON g.id = m.goal_id
    WHERE m.user_id = ? ORDER BY m.moved_on DESC`,
  ],
];

const addSheet = (workbook, name, rows, empty = "Nothing here yet.") => {
  const sheet = workbook.addWorksheet(name);
  if (rows.length === 0) {
    sheet.addRow([empty]);
    return;
  }
  const keys = Object.keys(rows[0]);
  sheet.columns = keys.map((key) => ({ header: key, key, width: Math.min(Math.max(key.length + 4, 14), 48) }));
  sheet.getRow(1).font = { bold: true };
  rows.forEach((row) => sheet.addRow(row));
};

// Everything we hold about the person, one sheet per area. Passwords and PINs are never included.
export const exportData = async (req, res) => {
  const userId = userIdOf(req);
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Expense Tracker";
    for (const [name, sql] of SHEETS) {
      const [rows] = await connection.execute(sql, [userId]);
      addSheet(workbook, name, rows);
      if (name === "Bills") {
        const { accounts } = await loadAccounts(userId);
        addSheet(
          workbook,
          "Accounts",
          accounts.map((account) => ({
            Name: account.name,
            Type: account.type,
            "Balance now (KES)": account.balance,
            "In Safe to spend": account.spendable ? "Yes" : "No",
          }))
        );
      }
    }

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=expense-tracker-data-${today()}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    fail(res, "Your data could not be prepared.", error);
  }
};

// Removes imported M-Pesa transactions, and the expenses they created unless asked to keep them.
// Balances already worked out from statements stay, so account balances don't jump.
export const deleteStatementData = async (req, res) => {
  const userId = userIdOf(req);
  const keepExpenses = req.body.keepExpenses === true;
  const db = await connection.getConnection();
  try {
    await db.beginTransaction();
    const [transactions] = await db.execute("DELETE FROM mpesa_transactions WHERE user_id = ?", [userId]);
    let expenses = 0;
    if (!keepExpenses) {
      const [removed] = await db.execute("DELETE FROM expense WHERE user_id = ? AND source = 'mpesa'", [userId]);
      expenses = removed.affectedRows;
    }
    await db.commit();
    await refreshUserBudgets(userId, req.user.email);

    const count = transactions.affectedRows;
    const what = `${count} M-Pesa ${count === 1 ? "transaction" : "transactions"}`;
    res.status(200).json({
      message: keepExpenses
        ? `Removed ${what}. Your expenses stay.`
        : `Removed ${what} and ${expenses} ${expenses === 1 ? "expense" : "expenses"} they created.`,
    });
  } catch (error) {
    await db.rollback();
    fail(res, "Your statement data could not be removed.", error);
  } finally {
    db.release();
  }
};
