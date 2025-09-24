import connection from "../database.js";

export const getPredictions = async (req, res) => {
  const id = parseInt(req.query.id);
  try {
    const [monthlyAverage] = await connection.execute(
      `
      SELECT 
    month,
    AVG(amount) AS monthly_average
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
    END);
      `,
      [id]
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
    const [budgetCategory] = await connection.execute(
      `
      SELECT 
      DISTINCT category,
      SUM(amount) OVER(PARTITION BY category) as total
      FROM budget
      WHERE user_id = ?
      ORDER BY total DESC
      `,
      [id]
    );
    const [topFiveCategories] = await connection.execute(
      `WITH cte_category AS (
      SELECT DISTINCT category,
      COUNT(category) OVER(PARTITION BY category) AS category_num
      FROM expense
      WHERE user_id = ?
      )
      SELECT * 
      FROM cte_category
      ORDER BY category_num DESC
      LIMIT 5`,
      [id]
    );
    const [bottomFiveCategories] = await connection.execute(
      `WITH cte_category AS (
      SELECT DISTINCT category,
      COUNT(category) OVER(PARTITION BY category) AS category_num
      FROM expense
      WHERE user_id = ?
      )
      SELECT * 
      FROM cte_category
      ORDER BY category_num 
      LIMIT 5`,
      [id]
    );
    const [avgAmount] = await connection.execute(
      `SELECT ROUND( AVG(amount), 2) AS avg_amount FROM expense WHERE user_id = ?`,
      [id]
    );
    res.status(200).json({
      monthlyAverage,
      topFiveCategories,
      bottomFiveCategories,
      budgetCategory,
      categoryExpense,
      avgAmount,
      message: "Your predicted data is successfully retrieved",
    });
  } catch (error) {
    console.log("Error:", error);
    res
      .status(500)
      .json({ error: true, message: "Something went wrong. Try again later." });
  }
};
