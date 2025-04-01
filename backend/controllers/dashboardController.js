import connection from "../database.js";

const getReportData = async (req, res) => {
  const { id } = req.params;

  try {
    //add a rolling sum to the amount column of the data
    const [barData] = await connection
      .promise()
      .execute(
        "SELECT month, category, amount FROM expense WHERE expense_id = ?",
        [id]
      );

    const [debtData] = await connection
      .promise()
      .execute("SELECT * FROM expense WHERE category = ? AND expense_id = ?", [
        "debt",
        id,
      ]);

    const [budgetData] = await connection
      .promise()
      .execute("SELECT amount FROM budget WHERE budget_id = ?", [id]);
    res.status(200).json({
      message: "Reports fetched successfully",
      barData,
      debtData,
      budgetData,
    });
  } catch (error) {
    res.status(500).json({
      error: true,
      message: "Error in fetching reports",
      details: error.message,
    });
  }
};

export default getReportData;
