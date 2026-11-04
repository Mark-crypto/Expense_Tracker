import connection from "../database.js";
import { claimAlert, currentMonth, loadAlertSettings, loadBudgets, pacesAlerted } from "./budgetStatus.js";
import { addCycle, loadTracked, monthlyCost, nameOf } from "./recurring.js";

const HISTORY_MONTHS = 6;
const BILL_LOOKBACK = 4;
const BILL_MIN_MONTHS = 3;
const BILL_MAX_PER_MONTH = 1.5;
const RATE_MONTHS = 3;
const ONE_OFF_MULTIPLE = 3;
const MIN_ONE_OFF = 5000;
const MIN_DAYS_TO_WARN = 5;

const pad = (value) => String(value).padStart(2, "0");
const shiftMonth = (month, by) => {
  const [year, number] = month.split("-").map(Number);
  const date = new Date(year, number - 1 + by, 1);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
};
const daysIn = (month) => {
  const [year, number] = month.split("-").map(Number);
  return new Date(year, number, 0).getDate();
};
const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
};
const round = (value) => Math.round(value);

const detectBills = (rows, completed, dismissed) => {
  const window = completed.slice(-BILL_LOOKBACK);
  const groups = new Map();

  rows.forEach((row) => {
    const month = row.date.slice(0, 7);
    if (!window.includes(month)) return;
    const name = nameOf(row);
    const key = name.trim().toLowerCase();
    const group = groups.get(key) ?? { key, name, category: row.category, months: new Map() };
    group.months.set(month, [...(group.months.get(month) ?? []), row]);
    groups.set(key, group);
  });

  return [...groups.values()].flatMap((group) => {
    const payments = [...group.months.values()];
    const count = payments.flat().length;
    if (dismissed.has(group.key) || payments.length < BILL_MIN_MONTHS) return [];
    // Weekly shopping appears every month too, so limit how often it may occur.
    if (count / payments.length > BILL_MAX_PER_MONTH) return [];

    const totals = payments.map((list) => list.reduce((sum, row) => sum + row.amount, 0));
    return {
      key: group.key,
      name: group.name,
      category: group.category,
      amount: round(totals.reduce((sum, value) => sum + value, 0) / totals.length),
      varies: Math.max(...totals) - Math.min(...totals) > 0,
      day: median(payments.flat().map((row) => Number(row.date.slice(8)))),
    };
  });
};

const spreadOf = (values) => {
  if (values.length < 2) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length);
};

const confidenceOf = (totals) => {
  if (totals.length < 2) return "low";
  const mean = totals.reduce((sum, value) => sum + value, 0) / totals.length;
  const variation = mean > 0 ? spreadOf(totals) / mean : 1;
  if (totals.length >= 4 && variation < 0.25) return "high";
  return "medium";
};

export const buildForecast = async (userId) => {
  const month = currentMonth();
  const now = new Date();
  const today = `${month}-${pad(now.getDate())}`;
  const dayOfMonth = now.getDate();
  const monthDays = daysIn(month);
  const daysLeft = monthDays - dayOfMonth;
  const completed = Array.from({ length: HISTORY_MONTHS }, (_, i) => shiftMonth(month, i - HISTORY_MONTHS));

  const [raw] = await connection.execute(
    `SELECT amount, category, merchant, description, subcategories, budget_id,
      DATE_FORMAT(date_created, '%Y-%m-%d') AS date
    FROM expense
    WHERE user_id = ? AND status = 'active' AND date_created >= ?`,
    [userId, `${completed[0]}-01`]
  );
  const [dismissedRows] = await connection.execute(
    "SELECT bill_key FROM dismissed_bills WHERE user_id = ?",
    [userId]
  );

  const rows = raw
    .filter((row) => row.date <= today)
    .map((row) => ({ ...row, amount: Number(row.amount) }));
  const current = rows.filter((row) => row.date.startsWith(month));
  const past = rows.filter((row) => !row.date.startsWith(month));

  const monthTotals = completed
    .map((key) => past.filter((row) => row.date.startsWith(key)))
    .filter((list) => list.length > 0)
    .map((list) => list.reduce((sum, row) => sum + row.amount, 0));

  const spent = current.reduce((sum, row) => sum + row.amount, 0);
  const dismissed = new Set(dismissedRows.map((row) => row.bill_key));
  const tracked = await loadTracked(userId);
  const activeBills = tracked.filter((bill) => bill.status === "active");
  const trackedKeys = tracked.map((bill) => bill.name.trim().toLowerCase());
  const detected = detectBills(past, completed, new Set([...dismissed, ...trackedKeys]));
  const billKeys = new Set([...detected.map((bill) => bill.key), ...trackedKeys]);

  const monthEnd = `${month}-${pad(monthDays)}`;
  const trackedThisMonth = activeBills.flatMap((bill) => {
    const shared = {
      name: bill.name,
      category: bill.category,
      amount: round(bill.amount),
      varies: bill.varies,
      tracked: true,
      overdue: false,
    };
    const key = bill.name.trim().toLowerCase();
    const dates = [];
    for (let date = bill.next_due; date <= monthEnd; date = addCycle(date, bill.frequency, bill.due_day)) dates.push(date);
    if (dates.length === 0) {
      const paid = current.some((row) => nameOf(row).trim().toLowerCase() === key);
      return paid ? [{ ...shared, key, paid: true, date: bill.next_due, day: bill.due_day }] : [];
    }
    return dates.map((date) => ({ ...shared, key: `${key}-${date}`, paid: false, date, day: Number(date.slice(8)) }));
  });

  const bills = detected
    .map((bill) => {
      const paid = current.some((row) => nameOf(row).trim().toLowerCase() === bill.key);
      const expected = `${month}-${pad(Math.min(bill.day, monthDays))}`;
      return {
        ...bill,
        paid,
        overdue: !paid && expected < today,
        date: !paid && expected < today ? today : expected,
      };
    })
    .concat(trackedThisMonth)
    .sort((a, b) => a.date.localeCompare(b.date));
  const upcoming = bills.filter((bill) => !bill.paid);
  const stillToCome = upcoming.reduce((sum, bill) => sum + bill.amount, 0);

  // Everyday spending: recent months, without bills or rare large payments.
  const rateMonths = completed.filter((key) => past.some((row) => row.date.startsWith(key))).slice(-RATE_MONTHS);
  const everyday = past.filter(
    (row) => rateMonths.includes(row.date.slice(0, 7)) && !billKeys.has(nameOf(row).trim().toLowerCase())
  );
  const typical = median(everyday.map((row) => row.amount));
  const usual = everyday.filter((row) => row.amount <= Math.max(typical * ONE_OFF_MULTIPLE, MIN_ONE_OFF));
  const rateDays = rateMonths.reduce((sum, key) => sum + daysIn(key), 0) || 1;
  const categoryRates = {};
  usual.forEach((row) => {
    categoryRates[row.category] = (categoryRates[row.category] ?? 0) + row.amount / rateDays;
  });
  const dailyRate = Object.values(categoryRates).reduce((sum, value) => sum + value, 0);

  const likelyExtra = dailyRate * daysLeft;
  const total = spent + stillToCome + likelyExtra;
  const spread = spreadOf(monthTotals) * (daysLeft / monthDays);

  const billsByDate = new Map();
  upcoming.forEach((bill) => billsByDate.set(bill.date, (billsByDate.get(bill.date) ?? 0) + bill.amount));
  const spentByDate = new Map();
  current.forEach((row) => spentByDate.set(row.date, (spentByDate.get(row.date) ?? 0) + row.amount));

  let running = 0;
  let projected = spent;
  const curve = Array.from({ length: monthDays }, (_, index) => {
    const date = `${month}-${pad(index + 1)}`;
    if (date <= today) {
      running += spentByDate.get(date) ?? 0;
      if (date < today) return { date, actual: round(running) };
      projected = running + (billsByDate.get(today) ?? 0);
      return { date, actual: round(running), forecast: round(projected), low: round(projected), high: round(projected), bill: billsByDate.get(date) ?? null };
    }
    projected += dailyRate + (billsByDate.get(date) ?? 0);
    const reach = daysLeft > 0 ? (index + 1 - dayOfMonth) / daysLeft : 0;
    return {
      date,
      forecast: round(projected),
      low: round(Math.max(spent, projected - spread * reach)),
      high: round(projected + spread * reach),
      bill: billsByDate.get(date) ?? null,
    };
  });

  const { budgets } = await loadBudgets(userId);
  const live = budgets.filter(
    (budget) => !budget.has_time_limit && ["active", "exceeded"].includes(budget.status)
  );
  const outlook = live
    .map((budget) => {
      const billsLeft = upcoming
        .filter((bill) => bill.category === budget.category)
        .reduce((sum, bill) => sum + bill.amount, 0);
      const forecast = budget.spent + billsLeft + (categoryRates[budget.category] ?? 0) * daysLeft;
      return {
        budget_id: budget.budget_id,
        name: budget.name,
        category: budget.category,
        limit: budget.limit,
        spent: budget.spent,
        forecast: round(forecast),
        over: round(forecast - budget.limit),
      };
    })
    .sort((a, b) => b.over - a.over);

  const budgetLimit = live.reduce((sum, budget) => sum + budget.limit, 0);
  const budgetSpent = live.reduce((sum, budget) => sum + budget.spent, 0);
  const budgetCategories = new Set(live.map((budget) => budget.category));
  const billsInBudgets = upcoming
    .filter((bill) => budgetCategories.has(bill.category))
    .reduce((sum, bill) => sum + bill.amount, 0);
  const free = budgetLimit - budgetSpent - billsInBudgets;

  const remaining = {};
  Object.entries(categoryRates).forEach(([category, rate]) => {
    remaining[category] = (remaining[category] ?? 0) + rate * daysLeft;
  });
  upcoming.forEach((bill) => {
    remaining[bill.category] = (remaining[bill.category] ?? 0) + bill.amount;
  });

  const allBills =
    detected.reduce((sum, bill) => sum + bill.amount, 0) +
    activeBills.reduce((sum, bill) => sum + monthlyCost(bill), 0);

  return {
    month,
    today,
    daysLeft,
    enough: monthTotals.length > 0,
    confidence: confidenceOf(monthTotals),
    monthsOfHistory: monthTotals.length,
    spent: round(spent),
    stillToCome: round(stillToCome),
    likelyExtra: round(likelyExtra),
    total: round(total),
    low: round(Math.max(spent, total - spread)),
    high: round(total + spread),
    lastMonth: round(past.filter((row) => row.date.startsWith(completed.at(-1))).reduce((sum, row) => sum + row.amount, 0)),
    budgetLimit,
    safePerDay: budgetLimit > 0 && daysLeft > 0 ? round(Math.max(free, 0) / daysLeft) : null,
    curve,
    bills,
    dismissedBills: [...dismissed],
    outlook,
    whatIf: Object.entries(remaining)
      .map(([category, amount]) => ({ category, amount: round(amount) }))
      .filter(({ amount }) => amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 4),
    nextMonths: [1, 2, 3].map((step) => {
      const key = shiftMonth(month, step);
      return { month: key, estimate: round(allBills + dailyRate * daysIn(key)) };
    }),
    canWarn: dayOfMonth >= MIN_DAYS_TO_WARN,
  };
};

// Warns while a budget is still within its limit but heading over it.
export const syncForecastAlerts = async (userId, forecast) => {
  const warnings = [];
  const { mode: defaultMode } = await loadAlertSettings(userId);
  const [modes] = await connection.execute("SELECT budget_id, alert_mode, period FROM budget WHERE user_id = ?", [userId]);
  const settingsOf = new Map(modes.map((row) => [row.budget_id, row]));

  for (const budget of forecast.outlook) {
    const heading = forecast.canWarn && forecast.enough && budget.over > 0 && budget.spent <= budget.limit;
    const [[open]] = await connection.execute(
      "SELECT id FROM notifications WHERE budget_id = ? AND type = 'system' AND status = 'unread'",
      [budget.budget_id]
    );

    if (heading) {
      warnings.push({ budget_id: budget.budget_id, name: budget.name, category: budget.category, over: budget.over });
      const settings = settingsOf.get(budget.budget_id);
      const wanted = pacesAlerted(settings?.alert_mode ?? defaultMode);
      if (wanted && (await claimAlert({ budget_id: budget.budget_id, period: settings?.period }, userId, "pace"))) {
        const label = budget.name.replace(/\b\w/g, (char) => char.toUpperCase());
        await connection.execute(
          "INSERT INTO notifications (user_id, budget_id, type, message) VALUES (?, ?, 'system', ?)",
          [userId, budget.budget_id, `${label} is on track to finish KES ${budget.over.toLocaleString("en-KE")} over.`]
        );
      }
    } else if (open) {
      await connection.execute("UPDATE notifications SET status = 'resolved' WHERE id = ?", [open.id]);
    }
  }

  return warnings;
};
