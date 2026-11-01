const DAY = 86400000;
// One big payment early on says nothing about the month, so wait before forecasting.
const MIN_DAYS_TO_FORECAST = 5;

const dayCount = (from, to) => Math.round((to - from) / DAY) + 1;

const periodOf = (budget, month) => {
  if (budget.has_time_limit && budget.startDate && budget.endDate) {
    return [new Date(`${budget.startDate}T00:00`), new Date(`${budget.endDate}T00:00`)];
  }
  const [year, number] = month.split("-").map(Number);
  return [new Date(year, number - 1, 1), new Date(year, number, 0)];
};

// How far through its period a budget is, and where spending is heading.
export const budgetProgress = (budget, month) => {
  const [start, end] = periodOf(budget, month);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const totalDays = dayCount(start, end);
  const daysGone = Math.max(0, Math.min(totalDays, dayCount(start, now)));
  const daysLeft = Math.max(totalDays - daysGone + (now <= end && now >= start ? 1 : 0), 0);
  const elapsed = daysGone / totalDays;
  const share = budget.limit > 0 ? budget.spent / budget.limit : 0;
  const projected = daysGone > 0 ? (budget.spent / daysGone) * totalDays : budget.spent;
  const left = budget.limit - budget.spent;
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
  if (budget.spent > budget.limit) return { key: "over", label: "Over budget", tone: "danger" };
  if (
    progress.running &&
    progress.canForecast &&
    progress.projected > budget.limit &&
    progress.share > progress.elapsed
  ) {
    return { key: "fast", label: "Spending too fast", tone: "warning" };
  }
  if (progress.share >= 0.85) return { key: "near", label: "Almost used", tone: "warning" };
  return { key: "good", label: "On track", tone: "success" };
};

// Highest risk first: how far spending has run ahead of the calendar.
export const riskOf = (budget, progress) => progress.share - progress.elapsed;

export const shiftMonth = (month, by) => {
  const [year, number] = month.split("-").map(Number);
  const date = new Date(year, number - 1 + by, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};
