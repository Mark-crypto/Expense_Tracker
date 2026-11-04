import connection from "../database.js";
import { currentMonth, liveBudgets, loadBudgets, reopenAlerts, shiftMonth } from "./budgetStatus.js";
import { lastDayOf, today } from "./dates.js";
import { loadTracked, monthlyCost, usualMoneyIn } from "./recurring.js";
import { paymentsBefore } from "./safeToSpend.js";

const FULL_MONTHS = 3;
const ROUND_TO = 100;
const UNDERSPENT_SHARE = 0.75;

const roundedUp = (value) => Math.ceil(value / ROUND_TO) * ROUND_TO;

export const isRegular = (budget) => !budget.has_time_limit;

// One regular budget per category. A one-off can sit alongside it.
export const regularBudgetFor = async (userId, category, except = 0) => {
  const [[row]] = await connection.execute(
    `SELECT budget_id, name FROM budget
    WHERE user_id = ? AND category = ? AND has_time_limit = 0 AND status IN ('active', 'exceeded') AND budget_id <> ?`,
    [userId, category, except]
  );
  return row ?? null;
};

export const saveLimit = async (userId, budget, amount, scope) => {
  const month = currentMonth();
  const onlyMonth = scope === "forward" ? 0 : 1;
  await connection.execute(
    `INSERT INTO budget_limits (budget_id, user_id, from_month, only_month, amount) VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE amount = VALUES(amount)`,
    [budget.budget_id, userId, month, onlyMonth, amount]
  );
  if (scope === "forward") {
    await connection.execute("UPDATE budget SET amount = ? WHERE budget_id = ?", [amount, budget.budget_id]);
    await connection.execute("DELETE FROM budget_limits WHERE budget_id = ? AND from_month = ? AND only_month = 1", [
      budget.budget_id,
      month,
    ]);
  }
  await connection.execute(
    "INSERT INTO budget_changes (user_id, budget_id, old_amount, new_amount, scope, month) VALUES (?, ?, ?, ?, ?, ?)",
    [userId, budget.budget_id, budget.baseLimit, amount, scope, month]
  );
  await reopenAlerts(userId, budget.budget_id);
};

export const loadChanges = async (userId) => {
  const [rows] = await connection.execute(
    `SELECT budget_id, old_amount, new_amount, scope, month, DATE_FORMAT(created_at, '%Y-%m-%d') AS date
    FROM budget_changes WHERE user_id = ? ORDER BY created_at DESC, id DESC`,
    [userId]
  );
  const byBudget = new Map();
  for (const row of rows) {
    const list = byBudget.get(row.budget_id) ?? [];
    list.push({ date: row.date, from: Number(row.old_amount), to: Number(row.new_amount), scope: row.scope, month: row.month });
    byBudget.set(row.budget_id, list);
  }
  return byBudget;
};

// Tracked payments still to come this month, by category.
export const committedByCategory = async (userId) => {
  const month = currentMonth();
  const next = `${shiftMonth(month, 1)}-01`;
  const tracked = await loadTracked(userId);
  const totals = {};
  for (const { date, amount, category } of paymentsBefore(tracked, next)) {
    if (date >= today()) totals[category] = (totals[category] ?? 0) + amount;
  }
  return totals;
};

// How the month's money divides up: income, budgets and bills no budget covers.
export const buildPlanSummary = async (userId, budgets) => {
  const income = await usualMoneyIn(userId);
  const live = liveBudgets(budgets).filter(isRegular);
  const covered = new Set(live.map((budget) => budget.category));
  const tracked = (await loadTracked(userId)).filter((bill) => bill.status === "active");
  const billsOutside = Math.round(
    tracked.filter((bill) => !covered.has(bill.category)).reduce((sum, bill) => sum + monthlyCost(bill), 0)
  );
  const budgeted = Math.round(live.reduce((sum, budget) => sum + budget.limit, 0));
  return {
    income,
    budgeted,
    billsOutside,
    unassigned: income === null ? null : income - budgeted - billsOutside,
  };
};

const averageSpend = async (userId) => {
  const month = currentMonth();
  const [rows] = await connection.execute(
    `SELECT category, SUM(amount) AS total, COUNT(DISTINCT DATE_FORMAT(date_created, '%Y-%m')) AS months
    FROM expense
    WHERE user_id = ? AND status = 'active' AND date_created >= ? AND date_created < ?
    GROUP BY category`,
    [userId, `${shiftMonth(month, -FULL_MONTHS)}-01`, `${month}-01`]
  );
  return new Map(rows.map((row) => [row.category, Math.round(Number(row.total) / row.months)]));
};

export const suggestedLimit = async (userId, category) => (await averageSpend(userId)).get(category) ?? 0;

export const buildPlan = async (userId) => {
  const month = currentMonth();
  const { budgets } = await loadBudgets(userId);
  const { budgets: lastMonth } = await loadBudgets(userId, shiftMonth(month, -1));
  const averages = await averageSpend(userId);
  const tracked = (await loadTracked(userId)).filter((bill) => bill.status === "active");
  const billsIn = (category) =>
    Math.round(tracked.filter((bill) => bill.category === category).reduce((sum, bill) => sum + monthlyCost(bill), 0));

  const regular = liveBudgets(budgets).filter(isRegular);
  const categories = new Set([...averages.keys(), ...regular.map((budget) => budget.category)]);
  const rows = [...categories].map((category) => {
    const current = regular.find((budget) => budget.category === category);
    const previous = lastMonth.find((budget) => budget.budget_id === current?.budget_id);
    const average = averages.get(category) ?? 0;
    return {
      category,
      budgetId: current?.budget_id ?? null,
      period: current?.period ?? "monthly",
      current: current?.baseLimit ?? null,
      lastMonth: previous?.baseLimit ?? null,
      suggested: roundedUp(Math.max(average, billsIn(category))),
      average,
      bills: billsIn(category),
    };
  });

  const summary = await buildPlanSummary(userId, budgets);
  return {
    month,
    income: summary.income,
    billsOutside: Math.round(
      tracked.filter((bill) => !categories.has(bill.category)).reduce((sum, bill) => sum + monthlyCost(bill), 0)
    ),
    rows: rows.sort((a, b) => Math.max(b.current ?? 0, b.suggested) - Math.max(a.current ?? 0, a.suggested)),
  };
};

export const buildReview = async (userId, month) => {
  const { budgets } = await loadBudgets(userId, month);
  const rows = budgets
    .filter((budget) => budget.period === "monthly" && budget.status !== "inactive" && budget.limit > 0)
    .filter((budget) => budget.firstMonth <= month)
    .map((budget) => {
      const over = budget.spent > budget.limit;
      const underspent = budget.spent < budget.limit * UNDERSPENT_SHARE;
      return {
        budget_id: budget.budget_id,
        name: budget.name,
        category: budget.category,
        limit: budget.limit,
        spent: budget.spent,
        over,
        suggestion: over ? roundedUp(budget.spent) : underspent ? roundedUp(budget.spent * 1.1) : null,
      };
    });
  return {
    month,
    days: lastDayOf(month),
    onTrack: rows.filter((row) => !row.over).length,
    over: rows.filter((row) => row.over).length,
    rows: rows.filter((row) => row.suggestion !== null),
  };
};
