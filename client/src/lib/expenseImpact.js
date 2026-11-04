import { formatKES, localToday, titleCase } from "@/lib/format";

// Before and after for the budget, today's Safe to spend and the account this expense touches.
export const impactsOf = ({ amount, date, budget, safe, account }) => {
  const value = Number(amount) || 0;
  if (value <= 0) return [];
  const thisMonth = date?.slice(0, 7) === localToday().slice(0, 7);
  const rows = [];
  if (budget && thisMonth) {
    const after = budget.left - value;
    rows.push({
      key: "budget",
      label: `${titleCase(budget.name)} budget`,
      short: titleCase(budget.name),
      before: budget.left,
      after,
      over: after < 0 ? `This takes it ${formatKES(-after)} over` : null,
      bar: budget.limit > 0 ? { spent: budget.spent / budget.limit, adds: value / budget.limit, limit: budget.limit } : null,
    });
  }
  if (safe && date === localToday()) {
    rows.push({
      key: "safe",
      label: "Safe to spend today",
      short: "Safe to spend",
      before: safe.leftToday,
      after: Math.max(safe.leftToday - value, 0),
      over: value > safe.leftToday ? `${formatKES(value - safe.leftToday)} over today's amount` : null,
    });
  }
  if (account) {
    rows.push({ key: "account", label: account.name, short: account.name, before: account.balance, after: account.balance - value });
  }
  return rows;
};
