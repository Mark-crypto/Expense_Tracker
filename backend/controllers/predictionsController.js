import connection from "../database.js";

export const getPredictions = async (req, res) => {
  try {
    const [monthlyAverage] = await connection.execute(`
      SELECT DISTINCT month,
      AVG(amount) OVER(ORDER BY month) AS monthly_average
      FROM expense`);
    const [categoryExpense] = await connection.execute(`
      SELECT  
      DISTINCT category,
      SUM(amount) OVER(PARTITION BY category) as total
      FROM expense
      ORDER BY total DESC
      `);
    const [budgetCategory] = await connection.execute(`
      SELECT 
      DISTINCT category,
      SUM(amount) OVER(PARTITION BY category) as total
      FROM budget
      ORDER BY total DESC
      `);
    const [topFiveCategories] = await connection.execute(
      `WITH cte_category AS (
      SELECT DISTINCT category,
      COUNT(category) OVER(PARTITION BY category) AS category_num
      FROM expense
      )
      SELECT * 
      FROM cte_category
      ORDER BY category_num DESC
      LIMIT 5`
    );
    const [bottomFiveCategories] = await connection.execute(
      `WITH cte_category AS (
      SELECT DISTINCT category,
      COUNT(category) OVER(PARTITION BY category) AS category_num
      FROM expense
      )
      SELECT * 
      FROM cte_category
      ORDER BY category_num 
      LIMIT 5`
    );
    res.status(200).json({
      monthlyAverage,
      topFiveCategories,
      bottomFiveCategories,
      budgetCategory,
      categoryExpense,
      message: "Your predicted data is successfully retrieved",
    });
  } catch (error) {
    console.log("Error:", error);
    res
      .status(500)
      .json({ error: true, message: "Something went wrong. Try again later." });
  }
};
