import connection from "../database.js";

export const reports = async (req, res) => {
  const id = parseInt(req.user.userId);
  try {
    const [bottomFive] = await connection.execute(
      `
      WITH cte_rolling_sum AS (
      SELECT expense_id,amount, date_created,
      SUM(amount) OVER(ORDER BY expense_id) AS rolling_sum
      FROM expense
      WHERE user_id = ?
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
        WHERE user_id = ?
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
      WHERE user_id = ?
      LIMIT 5`,
      [id]
    );
    const [debtAmount] = await connection.execute(
      ` 
        SELECT SUM(CASE WHEN category='debt' THEN amount ELSE 0 END) AS debt FROM expense WHERE user_id = ?
        `,
      [id]
    );
    const [lastCategory] = await connection.execute(
      `WITH cte_category AS (
      SELECT DISTINCT category,
      COUNT(category) OVER(PARTITION BY category) AS category_num
      FROM expense
      WHERE user_id = ?
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
        WHERE user_id = ?
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
    month,
    SUM(amount) AS monthly_sum
  FROM expense
  WHERE user_id = ?
  GROUP BY month
  ORDER BY 
    (CASE month
      WHEN 'January' THEN 1
      WHEN 'February' THEN 2
      WHEN 'March' THEN 3
      WHEN 'April' THEN 4
      WHEN 'May' THEN 5
      WHEN 'June' THEN 6
      WHEN 'July' THEN 7
      WHEN 'August' THEN 8
      WHEN 'September' THEN 9
      WHEN 'October' THEN 10
      WHEN 'November' THEN 11
      WHEN 'December' THEN 12
    END);`,
      [id]
    );
    const [allCategories] = await connection.execute(
      `SELECT  
      DISTINCT category,
      SUM(amount) OVER(PARTITION BY category) as total
      FROM expense
      WHERE user_id = ?
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
      "SELECT SUM(amount) AS spent_total  FROM expense  WHERE user_id = ?",
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
