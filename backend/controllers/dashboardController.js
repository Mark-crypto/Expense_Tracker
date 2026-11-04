import connection from "../database.js";
import { loadAccounts, manualIncomeByMonth } from "../utils/accounts.js";
import { loadBudgets, refreshUserBudgets } from "../utils/budgetStatus.js";
import { buildForecast, syncForecastAlerts } from "../utils/forecast.js";
import { loadGoals, noteBehindGoals, publicGoal } from "../utils/goals.js";
import { billsAttention, captureDue, findSuggestions, loadTracked } from "../utils/recurring.js";
import { buildComingUp, buildSafeToSpend, findLowBalance } from "../utils/safeToSpend.js";

export const reports = async (req, res) => {
  const id = parseInt(req.user.userId);
  try {
    const [bottomFive] = await connection.execute(
      `
      WITH cte_rolling_sum AS (
      SELECT expense_id,amount, date_created,
      SUM(amount) OVER(ORDER BY expense_id) AS rolling_sum
      FROM expense
      WHERE user_id = ? AND status = 'active'
      )
      SELECT * FROM (
      SELECT * FROM cte_rolling_sum
      ORDER BY rolling_sum DESC
      LIMIT 5
      ) AS bottom_five
      ORDER BY expense_id
      `,
      [id]
    );
    const [totalExpense] = await connection.execute(
      `
         WITH cte_rolling_sum AS (
        SELECT expense_id,amount, date_created,
        SUM(amount) OVER(ORDER BY expense_id) AS rolling_sum
        FROM expense
        WHERE user_id = ? AND status = 'active'
        )
        SELECT MAX(rolling_sum) AS total FROM (
        SELECT * FROM cte_rolling_sum
        ORDER BY expense_id DESC
        LIMIT 5
        ) AS bottom_five
       
        `,
      [id]
    );
    const [topFive] = await connection.execute(
      ` 
      SELECT expense_id,amount, date_created,
      SUM(amount) OVER(ORDER BY expense_id) AS rolling_sum
      FROM expense
      WHERE user_id = ? AND status = 'active'
      LIMIT 5`,
      [id]
    );
    const [debtAmount] = await connection.execute(
      ` 
        SELECT SUM(CASE WHEN category='debt' THEN amount ELSE 0 END) AS debt FROM expense WHERE user_id = ? AND status = 'active'
        `,
      [id]
    );
    const [lastCategory] = await connection.execute(
      `WITH cte_category AS (
      SELECT DISTINCT category,
      COUNT(category) OVER(PARTITION BY category) AS category_num
      FROM expense
      WHERE user_id = ? AND status = 'active'
      )
      SELECT category 
      FROM cte_category
      ORDER BY category_num 
      LIMIT 1`,
      [id]
    );
    const [topCategory] = await connection.execute(
      `WITH cte_category AS (
        SELECT DISTINCT category,
        COUNT(category) OVER(PARTITION BY category) AS category_num
        FROM expense 
        WHERE user_id = ? AND status = 'active'
        )
        SELECT category 
        FROM cte_category
        ORDER BY category_num DESC
        LIMIT 1`,
      [id]
    );
    const [monthlySum] = await connection.execute(
      `
      SELECT
        DATE_FORMAT(date_created, '%b %y') AS month,
        SUM(amount) AS monthly_sum
      FROM expense
      WHERE user_id = ? AND status = 'active'
        AND date_created >= DATE_FORMAT(CURDATE() - INTERVAL 11 MONTH, '%Y-%m-01')
      GROUP BY DATE_FORMAT(date_created, '%Y-%m'), DATE_FORMAT(date_created, '%b %y')
      ORDER BY DATE_FORMAT(date_created, '%Y-%m')`,
      [id]
    );
    const [allCategories] = await connection.execute(
      `SELECT  
      DISTINCT category,
      SUM(amount) OVER(PARTITION BY category) as total
      FROM expense
      WHERE user_id = ? AND status = 'active'
      ORDER BY total DESC`,
      [id]
    );

    res.status(200).json({
      message: "Reports fetched successfully",
      topFive,
      debtAmount,
      bottomFive,
      monthlySum,
      topCategory,
      lastCategory,
      totalExpense,
      allCategories,
    });
  } catch (error) {
    console.log("Error:", error);
    res.status(500).json({
      error: true,
      message: "Something went wrong.",
    });
  }
};

export const getReportData = async (req, res) => {
  const id = parseInt(req.user.userId);
  try {
    const [expenseData] = await connection.execute(
      "SELECT SUM(amount) AS spent_total  FROM expense  WHERE user_id = ? AND status = 'active'",
      [id]
    );

    const [budgetData] = await connection.execute(
      "SELECT SUM(amount) AS budgeted_total FROM budget WHERE user_id = ?",
      [id]
    );
    res.status(200).json({
      message: "Reports fetched successfully",
      expenseData,
      budgetData,
    });
  } catch (error) {
    console.log("Error:", error);
    res.status(500).json({
      error: true,
      message: "Something went wrong.",
    });
  }
};

export const getOverview = async (req, res) => {
  const id = parseInt(req.user.userId);
  try {
    await captureDue(id);
    const [expenses] = await connection.execute(
      `SELECT expense_id, amount, category, subcategories, merchant, description,
        DATE_FORMAT(date_created, '%Y-%m-%d') AS date
      FROM expense
      WHERE user_id = ? AND status = 'active'
        AND date_created >= DATE_FORMAT(CURDATE() - INTERVAL 12 MONTH, '%Y-%m-01')
      ORDER BY date_created DESC`,
      [id]
    );

    await refreshUserBudgets(id, req.user.email);
    const { budgets: allBudgets } = await loadBudgets(id);
    const budgets = allBudgets.filter((row) => row.status === "active" || row.status === "exceeded");

    const [monthly] = await connection.execute(
      `SELECT DATE_FORMAT(occurred_at, '%Y-%m') AS month,
        SUM(paid_in) AS moneyIn,
        SUM(CASE WHEN kind = 'fee' THEN withdrawn ELSE 0 END) AS fees
      FROM mpesa_transactions
      WHERE user_id = ?
        AND occurred_at >= DATE_FORMAT(CURDATE() - INTERVAL 12 MONTH, '%Y-%m-01')
      GROUP BY month`,
      [id]
    );

    const forecastWarnings = await syncForecastAlerts(id, await buildForecast(id));

    const money = await loadAccounts(id);
    const tracked = await loadTracked(id);
    const extraIncome = await manualIncomeByMonth(id, money);
    const goals = await loadGoals(id, money.accounts);
    await noteBehindGoals(id, goals);
    const months = new Set([...monthly.map((row) => row.month), ...extraIncome.keys()]);
    const byMonth = new Map(monthly.map((row) => [row.month, row]));

    res.status(200).json({
      forecastWarnings,
      bills: await billsAttention(id),
      accounts: money.accounts.map(({ anchors, ...account }) => account),
      safeToSpend: await buildSafeToSpend(id, money.accounts, tracked),
      lowBalance: findLowBalance(money.accounts, tracked),
      goal: goals.length > 0 ? { ...publicGoal(goals[0]), count: goals.length } : null,
      upcoming: buildComingUp(tracked, (await findSuggestions(id, tracked)).length),
      expenses: expenses.map((row) => ({ ...row, amount: Number(row.amount) })),
      budgets: budgets.map(({ budget_id, name, category, status, limit, spent }) => ({
        budget_id,
        name,
        category,
        status,
        limit,
        spent,
      })),
      monthly: [...months].map((month) => ({
        month,
        moneyIn: Number(byMonth.get(month)?.moneyIn ?? 0) + (extraIncome.get(month) ?? 0),
        fees: Number(byMonth.get(month)?.fees ?? 0),
      })),
    });
  } catch (error) {
    console.log("Error:", error);
    res.status(500).json({ error: true, message: "Something went wrong." });
  }
};
