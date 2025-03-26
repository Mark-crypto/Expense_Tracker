import connection from "../database.js";

export const getExpenses = async (req, res) => {
  res.json({ message: "get expenses" });
};

export const createExpense = async (req, res) => {
  const {} = req.body;
  res.json({ message: "create expense" });
};

export const deleteExpense = async (req, res) => {
  const { id } = req.params;
  res.json({ message: "delete expense" });
};
