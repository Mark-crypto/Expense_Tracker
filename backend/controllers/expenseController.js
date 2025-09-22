import connection from "../database.js";

export const getExpenses = async (req, res) => {
  const pageNumber = parseInt(req.query._page) || 1;
  const limit = parseInt(req.query._limit) || 10;
  const offset = (pageNumber - 1) * limit;

  const limitString = limit.toString();
  const offsetString = offset.toString();

  try {
    const [rows] = await connection.execute(
      `SELECT * FROM expense WHERE status='active' ORDER BY date_created DESC LIMIT ? OFFSET ?`,
      [limitString, offsetString]
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
    return res.status(500).json({
      error: true,
      message: "An error occurred. No expenses were found.",
    });
  }
};

export const createExpense = async (req, res) => {
  const { amount, category, date } = req.body;
  // const months = [
  //   "January",
  //   "February",
  //   "March",
  //   "April",
  //   "May",
  //   "June",
  //   "July",
  //   "August",
  //   "September",
  //   "October",
  //   "November",
  //   "December",
  // ];
  // const randomMonth = Math.floor(Math.random() * months.length);
  const month = new Date(date).toLocaleString("default", { month: "long" });
  const userId = parseInt(req.user.userId);
  try {
    const [response] = await connection.execute(
      "INSERT INTO expense (amount , category , date_created, month, user_id) VALUES(?,?,?,?,?)",
      [amount, category, date, month, userId]
    );
    if (response == 0) {
      return res.status(400).json({
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
  try {
    const [response] = await connection.execute(
      "UPDATE expense SET status = 'inactive' "
    );
    if (response.length == 0) {
      return res.status(400).json({
        error: true,
        message: "An error occurred. Expenses were not deleted.",
      });
    }
    res.status(200).json({ message: "Expense deleted successfully." });
  } catch (error) {
    console.log("Error: ", error);
    return res.status(500).json({
      error: true,
      message: "An error occurred. Expenses were not deleted.",
    });
  }
};
