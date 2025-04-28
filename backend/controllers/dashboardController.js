import connection from "../database.js";

const getReportData = async (req, res) => {
  const { id } = req.params;

  try {
    const [rollingSum] = await connection.execute(`
      SELECT expense_id,amount, date_created,
      SUM(amount) OVER(ORDER BY expense_id) AS rolling_sum
      FROM expense`);
    const [barData] = await connection.execute(
      "SELECT month, category, amount FROM expense WHERE expense_id = ?",
      [id]
    );
    const [debtData] = await connection.execute(
      "SELECT * FROM expense WHERE category = ? ",
      ["debt"]
    );

    const [budgetData] = await connection.execute(
      "SELECT amount FROM budget WHERE budget_id = ?",
      [id]
    );
    res.status(200).json({
      message: "Reports fetched successfully",
      barData,
      debtData,
      budgetData,
      rollingSum,
    });
  } catch (error) {
    console.log("Error:", error);
    res.status(500).json({
      error: true,
      message: "An error occurred. Dashboard data is not available.",
    });
  }
};

export default getReportData;
