import connection from "../database.js";

export const getExpenses = async (req, res) => {
  try {
    connection.execute("SELECT * FROM expense", (error, data) => {
      if (error) {
        res
          .status(500)
          .json({ error: true, message: "Error fetching expenses" });
      }
      res.status(200).json({ data });
    });
  } catch (error) {
    res.status(500).json({ error: true, message: "Error fetching expenses" });
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
      "INSERT INTO expense SET amount = ?, category = ?, date =?, month = ?",
      [amount, category, date, months[randomMonth]],
      (error, data) => {
        if (error) {
          res
            .status(500)
            .json({ error: true, message: "Error creating expense" });
        }
        res.status(201).json({ data, message: "Expense created successfully" });
      }
    );
  } catch (error) {
    res.status(500).json({ error: true, message: "Error creating expense" });
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
          res
            .status(500)
            .json({ error: true, message: "Error deleting expense" });
        }
        res.status(200).json({ data, message: "Expense deleted successfully" });
      }
    );
  } catch (error) {
    res.status(500).json({ error: true, message: "Error deleting expense" });
  }
};
