import connection from "../database.js";

export const getExpenses = async (req, res) => {
  const pageNumber = parseInt(req.query._page) || 1;
  const limit = parseInt(req.query._limit) || 10;
  const offset = (pageNumber - 1) * limit;
  try {
    const data = await connection.execute(
      "SELECT * FROM expense ORDER BY date_created DESC LIMIT=? OFFSET=?",
      [limit, offset],
      (error, data) => {
        if (error) {
          return res
            .status(500)
            .json({ error: true, message: "Error fetching expenses" });
        }
        return data;
      }
    );
    const [countResult] = await connection.execute(
      "SELECT COUNT(*) AS total FROM expense"
    );
    const total = countResult[0]?.total || 0;
    res.status(200).json({
      data,
      meta: { pageNumber, limit, totalPages: math.ceil(total / limit), total },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ error: true, message: "Error fetching expenses" });
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
    connection.execute(
      "INSERT INTO expense SET amount = ?, category = ?, date_created =?, month = ?",
      [amount, category, date, months[randomMonth]],
      (error, data) => {
        if (error) {
          return res
            .status(500)
            .json({ error: true, message: "Error creating expense" });
        }
        return res
          .status(201)
          .json({ data, message: "Expense created successfully" });
      }
    );
  } catch (error) {
    return res
      .status(500)
      .json({ error: true, message: "Error creating expenses" });
  }
};

export const deleteExpense = async (req, res) => {
  const { id } = req.params;
  try {
    connection.execute(
      "DELETE FROM expense WHERE expense_id = ?",
      [id],
      (error, data) => {
        if (error) {
          return res
            .status(500)
            .json({ error: true, message: "Error deleting expense" });
        }
        return res
          .status(200)
          .json({ data, message: "Expense deleted successfully" });
      }
    );
  } catch (error) {
    return res
      .status(500)
      .json({ error: true, message: "Error deleting expense" });
  }
};
