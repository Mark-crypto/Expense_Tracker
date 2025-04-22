import connection from "../database.js";

export const getExpenses = async (req, res) => {
  const pageNumber = Math.max(1, parseInt(req.query._page) || 1);
  const limit = Math.max(1, parseInt(req.query._limit) || 10);
  const offset = (pageNumber - 1) * limit;

  try {
    const [rows] = await connection.execute(
      `SELECT * FROM expense ORDER BY date_created DESC LIMIT ${limit} OFFSET ${offset}`
    );

    const [countResult] = await connection.execute(
      "SELECT COUNT(*) AS total FROM expense"
    );
    const total = countResult[0]?.total || 0;
    res.status(200).json({
      data: rows,
      meta: { pageNumber, limit, totalPages: Math.ceil(total / limit), total },
    });
  } catch (error) {
    console.log("Error:", error);
    return res
      .status(500)
      .json({
        error: true,
        message: "An error occurred. No expenses were found.",
      });
  }
};

export const createExpense = async (req, res) => {
  const { amount, category, date } = req.body;
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const randomMonth = Math.floor(Math.random() * months.length);
  try {
    const response = await connection.execute(
      "INSERT INTO expense SET amount = ?, category = ?, date_created =?, month = ?",
      [amount, category, date, months[randomMonth]]
    );
    if (!response) {
      return res
        .status(500)
        .json({
          error: true,
          message: "An error occurred. Expense was not created.",
        });
    }
    res.status(201).json({ message: "Expense added successfully" });
  } catch (error) {
    console.log("Error:", error);
    return res.status(500).json({
      error: true,
      message: "An error occurred, Expense was not created.",
    });
  }
};

export const deleteExpense = async (req, res) => {
  const { id } = req.params;
  try {
    const response = await connection.execute(
      "DELETE FROM expense WHERE expense_id = ?",
      [id]
    );
    if (!response) {
      return res
        .status(500)
        .json({
          error: true,
          message: "An error occurred. Expenses were not deleted.",
        });
    }
    res.send(200).json({ message: "Expense deleted successfully." });
  } catch (error) {
    console.log("Error: ", error);
    return res.status(500).json({
      error: true,
      message: "An error occurred. Expenses were not deleted.",
    });
  }
};
