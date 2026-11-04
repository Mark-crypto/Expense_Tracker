import connection from "../database.js";
import { addDays, lastDayOf, today } from "./dates.js";
import { sendBudgetEmail } from "./emailAlert.js";

const HISTORY_MONTHS = 6;
const QUIET_FROM = 21;
const QUIET_UNTIL = 7;
const DAYS_IN_WEEK = 7;
export const HALF_WAY = 50;

export const currentMonth = () => today().slice(0, 7);

export const shiftMonth = (month, by) => {
  const [year, number] = month.split("-").map(Number);
  const date = new Date(year, number - 1 + by, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const money = (value) => `KES ${Math.round(value).toLocaleString("en-KE")}`;

// Weeks run Monday to Sunday.
const weekStart = (date) => addDays(date, -((new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7));

const inDates = (budget, date) =>
  (!budget.startDate || date >= budget.startDate) && (!budget.endDate || date <= budget.endDate);

const isLive = (budget) => ["active", "exceeded"].includes(budget.status);

// A budget id the person sent, if it's theirs; null otherwise.
export const ownBudgetId = async (userId, budgetId) => {
  if (!budgetId) return null;
  const [[row]] = await connection.execute("SELECT budget_id FROM budget WHERE budget_id = ? AND user_id = ?", [budgetId, userId]);
  return row?.budget_id ?? null;
};

// A manual link wins, then a one-off covering the date, then the category's regular budget.
const ownerOf = (expense, budgets, byId) => {
  if (expense.budget_id && byId.has(expense.budget_id)) return byId.get(expense.budget_id);
  const open = budgets.filter((budget) => budget.category === expense.category && budget.status !== "inactive");
  return open.find((budget) => budget.has_time_limit && inDates(budget, expense.date)) ?? open.find((budget) => !budget.has_time_limit);
};

const limitIn = (limits, month, fallback) => {
  const once = limits.find((row) => row.only && row.month === month);
  if (once) return once.amount;
  const lasting = limits.filter((row) => !row.only);
  return (lasting.findLast((row) => row.month <= month) ?? lasting[0])?.amount ?? fallback;
};

export const periodKey = (budget, now = today()) => {
  if (budget.period === "once") return "once";
  return budget.period === "weekly" ? weekStart(now) : now.slice(0, 7);
};

export const loadBudgets = async (userId, month = currentMonth()) => {
  const [rows] = await connection.execute(
    `SELECT budget_id, name, category, amount, status, has_time_limit, subcategories, period, rollover, alert_mode, warn_at,
      DATE_FORMAT(start_date, '%Y-%m-%d') AS startDate,
      DATE_FORMAT(end_date, '%Y-%m-%d') AS endDate
    FROM budget WHERE user_id = ?
    ORDER BY created_at DESC, budget_id DESC`,
    [userId]
  );
  const [limitRows] = await connection.execute(
    "SELECT budget_id, from_month, only_month, amount FROM budget_limits WHERE user_id = ? ORDER BY from_month",
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

  const isThisMonth = month === currentMonth();
  const thisWeek = weekStart(today());
  const inPeriod = (budget, date) => {
    if (budget.has_time_limit) return inDates(budget, date);
    if (budget.period === "weekly" && isThisMonth) return date >= thisWeek && date <= addDays(thisWeek, DAYS_IN_WEEK - 1);
    return date.startsWith(month);
  };

  const budgets = rows.map((row) => ({
    ...row,
    rollover: row.rollover === 1,
    limits: limitRows
      .filter((limit) => limit.budget_id === row.budget_id)
      .map((limit) => ({ month: limit.from_month, only: limit.only_month === 1, amount: Number(limit.amount) })),
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
    if (inPeriod(owner, expense.date)) {
      owner.spent += amount;
      owner.expenses.push({ ...expense, amount });
    }
  }

  const months = Array.from({ length: HISTORY_MONTHS }, (_, i) => shiftMonth(month, i + 1 - HISTORY_MONTHS));

  // A weekly limit becomes a month's worth when a whole month is on show.
  const monthLimit = (budget, key) => {
    const base = limitIn(budget.limits, key, Number(budget.amount));
    return budget.period === "weekly" ? Math.round((base * lastDayOf(key)) / DAYS_IN_WEEK) : base;
  };
  const shownLimit = (budget) =>
    budget.period === "weekly" && isThisMonth ? limitIn(budget.limits, month, Number(budget.amount)) : monthLimit(budget, month);

  // Only last month's unused money carries, and never from before the budget began.
  const carriedInto = (budget) => {
    const previous = shiftMonth(month, -1);
    if (!budget.rollover || budget.period !== "monthly" || previous < (budget.limits[0]?.month ?? month)) return 0;
    return Math.max(monthLimit(budget, previous) - (budget.byMonth[previous] ?? 0), 0);
  };

  const periodOf = (budget) => {
    if (budget.has_time_limit) return { periodStart: budget.startDate, periodEnd: budget.endDate };
    if (budget.period === "weekly" && isThisMonth) return { periodStart: thisWeek, periodEnd: addDays(thisWeek, DAYS_IN_WEEK - 1) };
    return { periodStart: `${month}-01`, periodEnd: `${month}-${String(lastDayOf(month)).padStart(2, "0")}` };
  };

  return {
    month,
    budgets: budgets.map(({ byMonth, amount, limits, ...budget }) => {
      const baseLimit = shownLimit({ ...budget, limits, amount });
      const carried = carriedInto({ ...budget, byMonth, limits, amount });
      return {
        ...budget,
        ...periodOf(budget),
        firstMonth: limits[0]?.month ?? month,
        baseLimit,
        carried,
        limit: baseLimit + carried,
        history: months.map((key) => ({
          month: key,
          spent: byMonth[key] ?? 0,
          limit: monthLimit({ ...budget, limits, amount }, key),
        })),
      };
    }),
    unbudgeted: Object.entries(unbudgeted)
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total),
  };
};

export const liveBudgets = (budgets) => budgets.filter(isLive);

export const loadAlertSettings = async (userId) => {
  const [[row]] = await connection.execute(
    "SELECT budget_alert_mode, budget_warn_at, budget_emails FROM users WHERE user_id = ?",
    [userId]
  );
  return { mode: row.budget_alert_mode, warnAt: row.budget_warn_at, emails: row.budget_emails === 1 };
};

export const pacesAlerted = (mode) => mode === "balanced" || mode === "everything";

const thresholdsFor = (mode, warnAt) => {
  if (mode === "everything") return [...new Set([HALF_WAY, warnAt])].sort((a, b) => a - b);
  return mode === "balanced" ? [warnAt] : [];
};

// The first caller for a budget, period and kind wins, so an alert can only fire once.
export const claimAlert = async (budget, userId, kind) => {
  const [result] = await connection.execute(
    "INSERT IGNORE INTO budget_alerts (budget_id, user_id, period_key, kind) VALUES (?, ?, ?, ?)",
    [budget.budget_id, userId, periodKey(budget), kind]
  );
  return result.affectedRows === 1;
};

const notify = (userId, budgetId, type, message) =>
  connection.execute(
    "INSERT INTO notifications (user_id, budget_id, type, message) VALUES (?, ?, ?, ?)",
    [userId, budgetId, type, message]
  );

const resolve = (budgetId, type) =>
  connection.execute(
    "UPDATE notifications SET status = 'resolved' WHERE budget_id = ? AND type = ? AND status = 'unread'",
    [budgetId, type]
  );

export const isQuietHour = (now = new Date()) => {
  const hour = Number(now.toLocaleString("en-GB", { hour: "2-digit", hour12: false, timeZone: "Africa/Nairobi" }));
  return hour >= QUIET_FROM || hour < QUIET_UNTIL;
};

const emailOver = async (budget, userId, email, message) => {
  if (!isQuietHour()) {
    await sendBudgetEmail(email, "Budget limit exceeded", [message]);
    return;
  }
  await connection.execute(
    "UPDATE budget_alerts SET pending_email = ? WHERE budget_id = ? AND period_key = ? AND kind = 'over'",
    [message, budget.budget_id, periodKey(budget)]
  );
};

// Sends anything held back during quiet hours.
export const flushBudgetEmails = async (onlyUser = null) => {
  const [rows] = await connection.execute(
    `SELECT a.budget_id, a.period_key, a.kind, a.pending_email, u.email
    FROM budget_alerts a JOIN users u ON u.user_id = a.user_id
    WHERE a.pending_email IS NOT NULL AND (? IS NULL OR a.user_id = ?)`,
    [onlyUser, onlyUser]
  );
  for (const { budget_id: budgetId, period_key: key, kind, pending_email: message, email } of rows) {
    await sendBudgetEmail(email, "Budget limit exceeded", [message]);
    await connection.execute(
      "UPDATE budget_alerts SET pending_email = NULL WHERE budget_id = ? AND period_key = ? AND kind = ?",
      [budgetId, key, kind]
    );
  }
};

const daysLeftIn = ({ periodEnd }) => {
  if (!periodEnd) return 0;
  return Math.max(Math.round((new Date(periodEnd) - new Date(today())) / 86400000) + 1, 0);
};

// Keeps every live budget's status and alerts in step with this period's spending.
export const refreshUserBudgets = async (userId, email) => {
  const { budgets } = await loadBudgets(userId);
  const settings = await loadAlertSettings(userId);

  for (const budget of liveBudgets(budgets)) {
    const { budget_id: id, name, spent, limit, status } = budget;
    const mode = budget.alert_mode ?? settings.mode;
    const label = name.replace(/\b\w/g, (char) => char.toUpperCase());

    if (spent > limit) {
      await resolve(id, "info");
      if (status === "active") {
        await connection.execute("UPDATE budget SET status = 'exceeded' WHERE budget_id = ?", [id]);
      }
      if ((await claimAlert(budget, userId, "over")) && mode !== "off") {
        const message = `${label} is ${money(spent - limit)} over. You've spent ${money(spent)} of ${money(limit)}.`;
        await notify(userId, id, "budget_exceeded", message);
        if (email && settings.emails) await emailOver(budget, userId, email, message);
      }
      continue;
    }

    if (status === "exceeded") {
      await connection.execute("UPDATE budget SET status = 'active', notified_exceeded = 0 WHERE budget_id = ?", [id]);
    }
    await resolve(id, "budget_exceeded");

    const passed = thresholdsFor(mode, budget.warn_at ?? settings.warnAt).filter((share) => limit > 0 && (spent / limit) * 100 >= share);
    if (passed.length === 0) {
      await resolve(id, "info");
      continue;
    }
    const claims = [];
    for (const share of passed) claims.push(await claimAlert(budget, userId, `at${share}`));
    if (claims.at(-1)) {
      const days = daysLeftIn(budget);
      const left = `${money(limit - spent)} left${days > 0 ? ` for ${days} ${days === 1 ? "day" : "days"}` : ""}`;
      await resolve(id, "info");
      await notify(userId, id, "info", `${label} is ${Math.round((spent / limit) * 100)}% used, ${left}.`);
    }
  }
};

// After a limit changes, alerts it no longer applies to may fire again.
export const reopenAlerts = async (userId, budgetId) => {
  const { budgets } = await loadBudgets(userId);
  const budget = budgets.find((row) => row.budget_id === budgetId);
  if (!budget) return;
  const key = periodKey(budget);
  const share = budget.limit > 0 ? (budget.spent / budget.limit) * 100 : 0;
  const [rows] = await connection.execute(
    "SELECT kind FROM budget_alerts WHERE budget_id = ? AND period_key = ?",
    [budgetId, key]
  );
  for (const { kind } of rows) {
    const stillPassed = kind === "over" ? share > 100 : kind === "pace" || share >= Number(kind.slice(2));
    if (!stillPassed) {
      await connection.execute("DELETE FROM budget_alerts WHERE budget_id = ? AND period_key = ? AND kind = ?", [budgetId, key, kind]);
    }
  }
};

const digestLine = (budget) => {
  const label = budget.name.replace(/\b\w/g, (char) => char.toUpperCase());
  if (budget.spent > budget.limit) return `${label}: ${money(budget.spent - budget.limit)} over ${money(budget.limit)}.`;
  const days = daysLeftIn(budget);
  const perDay = days > 0 ? `, about ${money((budget.limit - budget.spent) / days)} a day` : "";
  return `${label}: ${money(budget.limit - budget.spent)} left of ${money(budget.limit)}${perDay}.`;
};

export const sendWeeklyDigests = async (onlyUser = null) => {
  const [users] = await connection.execute(
    `SELECT DISTINCT u.user_id, u.email FROM users u JOIN budget b ON b.user_id = u.user_id
    WHERE u.budget_emails = 1 AND u.budget_alert_mode <> 'off' AND b.status IN ('active', 'exceeded')
      AND (? IS NULL OR u.user_id = ?)`,
    [onlyUser, onlyUser]
  );
  for (const { user_id: userId, email } of users) {
    await refreshUserBudgets(userId, email);
    const { budgets } = await loadBudgets(userId);
    const lines = liveBudgets(budgets).filter((budget) => budget.alert_mode !== "off").map(digestLine);
    if (lines.length > 0) await sendBudgetEmail(email, "Your budgets this week", lines);
  }
};
