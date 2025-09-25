import connection from "../database.js";
import dotenv from "dotenv";
dotenv.config();

export const expenseSearch = async (req, res) => {
  const searchQuery = req.query.q;
  const userId = parseInt(req.user.userId);
  try {
    if (!searchQuery)
      return res.status(400).json({ message: "No input was passed" });

    const [rows] = await connection.execute(
      "SELECT * FROM expense WHERE MATCH(category) AGAINST(?) AND user_id = ? LIMIT 10",
      [searchQuery, userId]
    );
    res.status(200).json({ data: rows });
  } catch (error) {
    console.log("Error:", error);
    res
      .status(500)
      .json({ error: true, message: "An error occurred. No expense found" });
  }
};

export const budgetSearch = async (req, res) => {
  const searchQuery = req.query.q;
  const userId = parseInt(req.user.userId);
  try {
    if (!searchQuery)
      return res.status(400).json({ message: "No input was passed" });

    const [rows] = await connection.execute(
      "SELECT * FROM budget WHERE name LIKE ? OR category LIKE ? AND user_id = ? LIMIT 10",
      [`%${searchQuery}%`, `%${searchQuery}%`, userId]
    );

    res.status(200).json({ data: rows });
  } catch (error) {
    console.log("Error:", error);
    res
      .status(500)
      .json({ error: true, message: "An error occurred. No budget found" });
  }
};
