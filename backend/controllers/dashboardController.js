import connection from "../database.js";

export const reports = async (req, res) => {
  try {
    const [rollingSum] = await connection.execute(` 
      SELECT expense_id,amount, date_created,
      SUM(amount) OVER(ORDER BY expense_id) AS rolling_sum
      FROM expense LIMIT 10`);
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
    const [topFive] = await connection.execute(` 
      SELECT expense_id,amount, date_created,
      SUM(amount) OVER(ORDER BY expense_id) AS rolling_sum
      FROM expense
      LIMIT 5`);

    res.status(200).json({
      message: "Reports fetched successfully",
      topFive,
      bottomFive,
      rollingSum,
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
