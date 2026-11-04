const DAY = 86400000;
// One big payment early on says nothing about the month, so wait before forecasting.
const MIN_DAYS_TO_FORECAST = 5;

export const LIMIT_STEP = 500;

export const PERIODS = [
  { value: "monthly", label: "Monthly", hint: "Resets each month" },
  { value: "weekly", label: "Weekly", hint: "Resets each Monday" },
  { value: "once", label: "One-off", hint: "For a trip or event, between two dates" },
];
export const periodLabel = (value) => PERIODS.find((row) => row.value === value)?.label ?? "Monthly";

export const ALERT_MODES = [
  { value: "important", label: "Important only", hint: "Only when you go over." },
  { value: "balanced", label: "Balanced", hint: "When you're spending too fast, near your limit, or over it." },
  { value: "everything", label: "Everything", hint: "Balanced, plus a heads-up at 50%." },
  { value: "off", label: "Off", hint: "No alerts. Budgets still track spending." },
];

const dayCount = (from, to) => Math.round((to - from) / DAY) + 1;

const periodOf = (budget, month) => {
  if (budget.periodStart && budget.periodEnd) {
    return [new Date(`${budget.periodStart}T00:00`), new Date(`${budget.periodEnd}T00:00`)];
  }
  const [year, number] = month.split("-").map(Number);
  return [new Date(year, number - 1, 1), new Date(year, number, 0)];
};

// How far through its period a budget is, and where spending is heading.
export const budgetProgress = (budget, month) => {
  const [start, end] = periodOf(budget, month);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const committed = budget.committed ?? 0;
  const totalDays = dayCount(start, end);
  const daysGone = Math.max(0, Math.min(totalDays, dayCount(start, now)));
  const daysLeft = Math.max(totalDays - daysGone + (now <= end && now >= start ? 1 : 0), 0);
  const elapsed = daysGone / totalDays;
  const share = budget.limit > 0 ? budget.spent / budget.limit : 0;
  const projected = (daysGone > 0 ? (budget.spent / daysGone) * totalDays : budget.spent) + committed;
  const left = budget.limit - budget.spent - committed;
  return {
    elapsed,
    share,
    left,
    daysLeft,
    projected,
    dailyLeft: daysLeft > 0 ? Math.max(left, 0) / daysLeft : 0,
    canForecast: daysGone >= MIN_DAYS_TO_FORECAST,
    running: daysLeft > 0,
  };
};

export const budgetState = (budget, progress) => {
  if (budget.status === "inactive") return { key: "paused", label: "Paused", tone: "muted" };
  if (budget.status === "expired") return { key: "ended", label: "Ended", tone: "muted" };
  if (budget.spent > budget.limit) return { key: "over", label: "Over", tone: "danger" };
  if (
    progress.running &&
    progress.canForecast &&
    progress.projected > budget.limit &&
    progress.share > progress.elapsed
  ) {
    return { key: "fast", label: "Watch", tone: "warning" };
  }
  if (progress.share >= 0.85) return { key: "near", label: "Watch", tone: "warning" };
  return { key: "good", label: "On track", tone: "success" };
};

// Highest risk first: how far spending has run ahead of the calendar.
export const riskOf = (budget, progress) => progress.share - progress.elapsed;

export const shiftMonth = (month, by) => {
  const [year, number] = month.split("-").map(Number);
  const date = new Date(year, number - 1 + by, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

export const movableBudgets = (budgets) =>
  budgets.filter((budget) => ["active", "exceeded"].includes(budget.status) && budget.period === "monthly");

// The budget with the most room to spare.
export const bestSource = (budgets, target) =>
  movableBudgets(budgets)
    .filter((budget) => budget.budget_id !== target.budget_id && budget.limit > budget.spent)
    .sort((a, b) => b.limit - b.spent - (a.limit - a.spent))[0];
