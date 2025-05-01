import connection from "../database.js";
import dotenv from "dotenv";
dotenv.config();

export const expenseSearch = async (req, res) => {
  const searchQuery = req.query.q;
  try {
    if (!searchQuery)
      return res.status(400).json({ message: "No input was passed" });

    const [rows] = await connection.execute(
      "SELECT * FROM expense WHERE MATCH(category) AGAINST(?) LIMIT 10",
      [searchQuery]
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
  try {
    if (!searchQuery)
      return res.status(400).json({ message: "No input was passed" });

    const [rows] = await connection.execute(
      "SELECT * FROM budget WHERE name LIKE ? OR category LIKE ? LIMIT 10",
      [`%${searchQuery}%`, `%${searchQuery}%`]
    );

    res.status(200).json({ data: rows });
  } catch (error) {
    console.log("Error:", error);
    res
      .status(500)
      .json({ error: true, message: "An error occurred. No budget found" });
  }
};
