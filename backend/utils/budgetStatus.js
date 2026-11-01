import connection from "../database.js";

// Puts an exceeded budget back to active once removed expenses bring it under its limit.
export const refreshBudgetStatus = async (budgetId) => {
  const [[budget]] = await connection.execute(
    "SELECT amount, status FROM budget WHERE budget_id = ?",
    [budgetId]
  );
  if (!budget || budget.status !== "exceeded") return;

  const [[{ total_spent }]] = await connection.execute(
    "SELECT COALESCE(SUM(amount), 0) AS total_spent FROM expense WHERE budget_id = ? AND status = 'active'",
    [budgetId]
  );
  if (Number(total_spent) > Number(budget.amount)) return;

  await connection.execute(
    "UPDATE budget SET status = 'active', notified_exceeded = 0 WHERE budget_id = ?",
    [budgetId]
  );
  await connection.execute(
    "UPDATE notifications SET status = 'resolved' WHERE budget_id = ? AND type = 'budget_exceeded' AND status = 'unread'",
    [budgetId]
  );
};
