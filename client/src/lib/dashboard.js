import { parseItems } from "./format";

export const monthKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const shiftMonth = (date, by) => new Date(date.getFullYear(), date.getMonth() + by, 1);

const monthRange = (end, count) =>
  Array.from({ length: count }, (_, i) => monthKey(shiftMonth(end, i - count + 1)));

export const monthLabel = (key, month = "short") => {
  const [year, number] = key.split("-").map(Number);
  return new Date(year, number - 1).toLocaleString("en-KE", { month });
};

export const buildPeriods = (today) => {
  const lastMonth = shiftMonth(today, -1);
  return {
    month: {
      label: "This month",
      months: monthRange(today, 1),
      previous: monthRange(lastMonth, 1),
      partial: true,
    },
    last: {
      label: "Last month",
      months: monthRange(lastMonth, 1),
      previous: monthRange(shiftMonth(today, -2), 1),
    },
    "3m": {
      label: "3 months",
      months: monthRange(today, 3),
      previous: monthRange(shiftMonth(today, -3), 3),
    },
    "6m": {
      label: "6 months",
      months: monthRange(today, 6),
      previous: monthRange(shiftMonth(today, -6), 6),
    },
  };
};

export const inMonths = (rows, months) =>
  rows.filter((row) => months.includes(row.date.slice(0, 7)));

export const total = (rows) => rows.reduce((sum, row) => sum + row.amount, 0);

const daysIn = (months) =>
  months.flatMap((key) => {
    const [year, month] = key.split("-").map(Number);
    const count = new Date(year, month, 0).getDate();
    return Array.from({ length: count }, (_, i) => `${key}-${String(i + 1).padStart(2, "0")}`);
  });

// Running totals per day. Days after `until` stay empty so the line stops at today.
const cumulative = (rows, months, until) => {
  const byDay = new Map();
  rows.forEach((row) => byDay.set(row.date, (byDay.get(row.date) ?? 0) + row.amount));

  let running = 0;
  return daysIn(months).map((date) => {
    const spent = byDay.get(date) ?? 0;
    running += spent;
    const future = until && date > until;
    return { date, spent: future ? null : spent, running: future ? null : running };
  });
};

export const buildCurve = (rows, period, until) => {
  const current = cumulative(inMonths(rows, period.months), period.months, until);
  const previous = cumulative(inMonths(rows, period.previous), period.previous);
  const length = Math.max(current.length, previous.length);

  return Array.from({ length }, (_, i) => ({
    date: current[i]?.date ?? null,
    spent: current[i]?.spent ?? null,
    running: current[i]?.running ?? null,
    previousDate: previous[i]?.date ?? null,
    previousRunning: previous[i]?.running ?? null,
  }));
};

// The change compares like with like: a part-month against the same days last month.
export const buildChange = (curve) => {
  const points = curve.filter((point) => point.running !== null);
  const last = points[points.length - 1];
  // Months differ in length, so use the last day the earlier period actually has.
  const before = points.findLast((point) => point.previousRunning !== null)?.previousRunning;
  if (!last || !before) return null;
  return {
    previous: before,
    percent: Math.round(((last.running - before) / before) * 100),
  };
};

export const displayName = (expense) =>
  expense.merchant ||
  parseItems(expense.subcategories)
    .map((item) => item.name)
    .join(", ") ||
  expense.description ||
  "Expense";
