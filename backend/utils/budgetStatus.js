import connection from "../database.js";
import { sendEmail } from "./emailAlert.js";

const HISTORY_MONTHS = 6;
const WARNING_SHARE = 0.8;

export const currentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const shiftMonth = (month, by) => {
  const [year, number] = month.split("-").map(Number);
  const date = new Date(year, number - 1 + by, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const inDates = (budget, date) =>
  (!budget.startDate || date >= budget.startDate) && (!budget.endDate || date <= budget.endDate);

// A manual link wins. Otherwise the newest live budget for that category takes it.
const ownerOf = (expense, budgets, byId) => {
  if (expense.budget_id && byId.has(expense.budget_id)) return byId.get(expense.budget_id);
  return budgets.find(
    (budget) =>
      budget.category === expense.category &&
      budget.status !== "inactive" &&
      (!budget.has_time_limit || inDates(budget, expense.date))
  );
};

export const loadBudgets = async (userId, month = currentMonth()) => {
  const [rows] = await connection.execute(
    `SELECT budget_id, name, category, amount, status, has_time_limit, email_checked, subcategories,
      DATE_FORMAT(start_date, '%Y-%m-%d') AS startDate,
      DATE_FORMAT(end_date, '%Y-%m-%d') AS endDate
    FROM budget WHERE user_id = ?
    ORDER BY created_at DESC, budget_id DESC`,
    [userId]
  );

  const oneOffStarts = rows.filter((row) => row.has_time_limit && row.startDate).map((row) => row.startDate);
  const historyStart = `${shiftMonth(month, 1 - HISTORY_MONTHS)}-01`;
  const from = [historyStart, ...oneOffStarts].sort()[0];

  const [expenses] = await connection.execute(
    `SELECT expense_id, amount, category, subcategories, merchant, description, budget_id,
      DATE_FORMAT(date_created, '%Y-%m-%d') AS date
    FROM expense
    WHERE user_id = ? AND status = 'active' AND date_created >= ?
    ORDER BY date_created DESC, expense_id DESC`,
    [userId, from]
  );

  const budgets = rows.map((row) => ({
    ...row,
    limit: Number(row.amount),
    spent: 0,
    expenses: [],
    byMonth: {},
  }));
  const byId = new Map(budgets.map((budget) => [budget.budget_id, budget]));
  const unbudgeted = {};

  for (const expense of expenses) {
    const amount = Number(expense.amount);
    const expenseMonth = expense.date.slice(0, 7);
    const owner = ownerOf(expense, budgets, byId);

    if (!owner) {
      if (expenseMonth === month) {
        unbudgeted[expense.category] = (unbudgeted[expense.category] ?? 0) + amount;
      }
      continue;
    }

    owner.byMonth[expenseMonth] = (owner.byMonth[expenseMonth] ?? 0) + amount;
    if (owner.has_time_limit ? inDates(owner, expense.date) : expenseMonth === month) {
      owner.spent += amount;
      owner.expenses.push({ ...expense, amount });
    }
  }

  const months = Array.from({ length: HISTORY_MONTHS }, (_, i) => shiftMonth(month, i + 1 - HISTORY_MONTHS));

  return {
    month,
    budgets: budgets.map(({ byMonth, amount, email_checked, ...budget }) => ({
      ...budget,
      history: months.map((key) => ({ month: key, spent: byMonth[key] ?? 0 })),
    })),
    unbudgeted: Object.entries(unbudgeted)
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total),
    emailChecked: new Map(budgets.map((budget) => [budget.budget_id, budget.email_checked === "checked"])),
  };
};

const hasUnread = async (budgetId, type) => {
  const [[row]] = await connection.execute(
    "SELECT id FROM notifications WHERE budget_id = ? AND type = ? AND status = 'unread'",
    [budgetId, type]
  );
  return !!row;
};

const notify = (userId, budgetId, type, message) =>
  connection.execute(
    "INSERT INTO notifications (user_id, budget_id, type, message) VALUES (?, ?, ?, ?)",
    [userId, budgetId, type, message]
  );

// Keeps every live budget's status and alerts in step with this period's spending.
export const refreshUserBudgets = async (userId, email) => {
  const { budgets, emailChecked } = await loadBudgets(userId);

  for (const budget of budgets) {
    if (!["active", "exceeded"].includes(budget.status)) continue;
    const { budget_id: id, name, spent, limit, status } = budget;

    if (spent > limit) {
      await connection.execute(
        "UPDATE notifications SET status = 'resolved' WHERE budget_id = ? AND type = 'info' AND status = 'unread'",
        [id]
      );
      if (status === "active") {
        await connection.execute("UPDATE budget SET status = 'exceeded' WHERE budget_id = ?", [id]);
      }
      if (!(await hasUnread(id, "budget_exceeded"))) {
        const message = `Your budget "${name}" has been exceeded by KES ${spent - limit}. You have spent KES ${spent} of KES ${limit}.`;
        await notify(userId, id, "budget_exceeded", message);
        if (email && emailChecked.get(id)) {
          await sendEmail(email, "Budget limit exceeded", message, `<p>${message}</p>`, id);
        }
      }
      continue;
    }

    if (status === "exceeded") {
      await connection.execute(
        "UPDATE budget SET status = 'active', notified_exceeded = 0 WHERE budget_id = ?",
        [id]
      );
    }
    await connection.execute(
      "UPDATE notifications SET status = 'resolved' WHERE budget_id = ? AND type = 'budget_exceeded' AND status = 'unread'",
      [id]
    );

    const nearLimit = limit > 0 && spent / limit >= WARNING_SHARE;
    if (nearLimit && !(await hasUnread(id, "info"))) {
      await notify(
        userId,
        id,
        "info",
        `Your budget "${name}" is ${Math.round((spent / limit) * 100)}% used. KES ${limit - spent} left.`
      );
    }
    if (!nearLimit) {
      await connection.execute(
        "UPDATE notifications SET status = 'resolved' WHERE budget_id = ? AND type = 'info' AND status = 'unread'",
        [id]
      );
    }
  }
};
