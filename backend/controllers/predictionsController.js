import connection from "../database.js";

export const getPredictions = async (req, res) => {
  const id = parseInt(req.user.userId);
  const currentMonth = new Date().getMonth() + 1;
  const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;

  try {
    const [monthlyTotal] = await connection.execute(
      `
      SELECT 
    month,
    SUM(amount) AS monthly_total
  FROM expense
  WHERE user_id = ? AND MONTH(date) IN (?, ?)
  GROUP BY month
      `,
      [id, lastMonth, currentMonth]
    );

    const [categoryExpense] = await connection.execute(
      `
      SELECT  
      DISTINCT category,
      SUM(amount) OVER(PARTITION BY category) as total
      FROM expense
      WHERE user_id = ?
      ORDER BY total DESC 
      `,
      [id]
    );
    const [avgBudgetAmount] = await connection.execute(
      `SELECT ROUND( AVG(amount), 2) AS avg_amount FROM budget WHERE user_id = ?`,
      [id]
    );
    // const [budgetCategory] = await connection.execute(
    //   `
    //   SELECT
    //   DISTINCT category,
    //   SUM(amount) OVER(PARTITION BY category) as total
    //   FROM budget
    //   WHERE user_id = ?
    //   ORDER BY total DESC
    //   `,
    //   [id]
    // );

    // const [topFiveCategories] = await connection.execute(
    //   `WITH cte_category AS (
    //   SELECT DISTINCT category,
    //   COUNT(category) OVER(PARTITION BY category) AS category_num
    //   FROM expense
    //   WHERE user_id = ?
    //   )
    //   SELECT *
    //   FROM cte_category
    //   ORDER BY category_num DESC
    //   LIMIT 5`,
    //   [id]
    // );
    // const [bottomFiveCategories] = await connection.execute(
    //   `WITH cte_category AS (
    //   SELECT DISTINCT category,
    //   COUNT(category) OVER(PARTITION BY category) AS category_num
    //   FROM expense
    //   WHERE user_id = ?
    //   )
    //   SELECT *
    //   FROM cte_category
    //   ORDER BY category_num
    //   LIMIT 5`,
    //   [id]
    // );
    // const [avgAmount] = await connection.execute(
    //   `SELECT ROUND( AVG(amount), 2) AS avg_amount FROM expense WHERE user_id = ?`,
    //   [id]
    // );

    //Calculations
    const totalCurrentMonth =
      monthlyTotal.length > 0
        ? monthlyTotal[monthlyTotal.length - 1].monthly_total
        : 0;
    const percentChange =
      monthlyTotal.length === 2
        ? ((monthlyTotal[1].monthly_total - monthlyTotal[0].monthly_total) /
            monthlyTotal[0].monthly_total) *
          100
        : 0;
    const avgDailyExpense =
      monthlyTotal.length > 0 ? totalCurrentMonth / new Date().getDate() : 0;
    const daysInMonth = new Date(
      new Date().getFullYear(),
      currentMonth,
      0
    ).getDate();
    const projectedExpense = avgDailyExpense * daysInMonth;
    const timePassedPercent = (new Date().getDate() / daysInMonth) * 100;
    const budgetUsedPercent =
      totalCurrentMonth && avgBudgetAmount.length > 0
        ? (totalCurrentMonth / avgBudgetAmount[0].avg_amount) * 100
        : 0;
    const budgetProgressMessage =
      budgetUsedPercent > timePassedPercent
        ? "You're spending faster than your budget pace."
        : "You're on track with your budget.";
    const categoryPercent = categoryExpense.map((item) => {
      return {
        category: item.category,
        percent: totalCurrentMonth
          ? ((item.total / totalCurrentMonth) * 100).toFixed(2)
          : 0,
      };
    });
    const getWeekNumber = (date) => {
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const pastDaysOfMonth = date.getDate() + startOfMonth.getDay() - 1;
      return Math.ceil(pastDaysOfMonth / 7);
    };
    const currentWeekNumber = getWeekNumber(new Date());
    const lastWeekNumber = currentWeekNumber - 1;
    const weeklyChange =
      currentWeekNumber && lastWeekNumber
        ? ((currentWeekNumber - lastWeekNumber) / lastWeekNumber) * 100
        : 0;
    const projectionMessage =
      projectedExpense > avgBudgetAmount[0].avg_amount
        ? `At this rate, you'll exceed your budget of ${
            avgBudgetAmount[0].avg_amount
          } with a projected expense of ${projectedExpense.toFixed(2)}.`
        : `You're on track to stay within your budget of ${
            avgBudgetAmount[0].avg_amount
          } with a projected expense of ${projectedExpense.toFixed(2)}.`;
    res.status(200).json({
      percentChange: percentChange.toFixed(2),
      avgDailyExpense: avgDailyExpense.toFixed(2),
      projectedExpense: projectedExpense.toFixed(2),
      timePassedPercent: timePassedPercent.toFixed(2),
      budgetUsedPercent: budgetUsedPercent.toFixed(2),
      budgetProgressMessage,
      categoryPercent,
      weeklyChange: weeklyChange.toFixed(2),
      monthlyTotal,
      projectionMessage,
      message: "Your predicted data is successfully retrieved",
    });
  } catch (error) {
    console.log("Error:", error);
    res
      .status(500)
      .json({ error: true, message: "Something went wrong. Try again later." });
  }
};
