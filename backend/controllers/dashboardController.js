import connection from "../database.js";

export const reports = async (req, res) => {
  try {
    const [bottomFive] = await connection.execute(`
      WITH cte_rolling_sum AS (
      SELECT expense_id,amount, date_created,
      SUM(amount) OVER(ORDER BY expense_id) AS rolling_sum
      FROM expense
      )
      SELECT * FROM (
      SELECT * FROM cte_rolling_sum
      ORDER BY rolling_sum DESC
      LIMIT 5
      ) AS bottom_five
      ORDER BY expense_id
      `);
    const [totalExpense] = await connection.execute(`
         WITH cte_rolling_sum AS (
        SELECT expense_id,amount, date_created,
        SUM(amount) OVER(ORDER BY expense_id) AS rolling_sum
        FROM expense
        )
        SELECT MAX(rolling_sum) AS total FROM (
        SELECT * FROM cte_rolling_sum
        ORDER BY expense_id DESC
        LIMIT 5
        ) AS bottom_five
       
        `);
    const [topFive] = await connection.execute(` 
      SELECT expense_id,amount, date_created,
      SUM(amount) OVER(ORDER BY expense_id) AS rolling_sum
      FROM expense
      LIMIT 5`);
    const [debtAmount] = await connection.execute(` 
        SELECT SUM(CASE WHEN category='debt' THEN amount ELSE 0 END) AS debt FROM expense
        `);
    const [lastCategory] = await connection.execute(
      `WITH cte_category AS (
      SELECT DISTINCT category,
      COUNT(category) OVER(PARTITION BY category) AS category_num
      FROM expense
      )
      SELECT category 
      FROM cte_category
      ORDER BY category_num 
      LIMIT 1`
    );
    const [topCategory] = await connection.execute(
      `WITH cte_category AS (
        SELECT DISTINCT category,
        COUNT(category) OVER(PARTITION BY category) AS category_num
        FROM expense
        )
        SELECT category 
        FROM cte_category
        ORDER BY category_num DESC
        LIMIT 1`
    );
    const [monthlySum] = await connection.execute(`
    SELECT 
    month,
    SUM(amount) AS monthly_sum
  FROM expense
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
    END);`);
    const [allCategories] = await connection.execute(
      `SELECT  
      DISTINCT category,
      SUM(amount) OVER(PARTITION BY category) as total
      FROM expense
      ORDER BY total DESC`
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
  // const id  = req.userInfo.userId;
  try {
    const [expenseData] = await connection.execute(
      "SELECT SUM(amount) AS spent_total  FROM expense" // WHERE USER_ID = ID
    );

    const [budgetData] = await connection.execute(
      "SELECT SUM(amount) AS budgeted_total FROM budget " // WHERE USER_ID = ID
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
