import connection from "../database.js";
//GET ID FROM req.userInfo

// Get all budgets
export async function getBudget(req, res) {
  try {
    const [rows] = await connection.execute("SELECT * FROM budget");
    res.status(200).json({ data: rows });
  } catch (error) {
    console.log("Error:", error);
    return res.status(500).json({
      error: true,
      message: "An error occurred. No budget was found.",
    });
  }
}

// Get a single budget
export async function getSingleBudget(req, res) {
  const { id } = req.params;
  try {
    const [rows] = await connection.execute(
      "SELECT * FROM budget WHERE budget_id = ?",
      [id]
    );
    res.status(200).json({ data: rows[0] });
  } catch (error) {
    console.log("Error:", error);
    return res.json({
      error: true,
      message: "An error occurred. No budget was found",
    });
  }
}

// Add a budget
export async function addBudget(req, res) {
  const { name, category, amount, email_checked } = req.body;
  try {
    const [response] = await connection.execute(
      "INSERT INTO budget (name,category, amount, email_checked, user_id ) VALUES(?,?,?,?)",
      [name, category, amount, email_checked, 1]
    );
    if (response.length == 0) {
      return res.status(400).json({
        error: true,
        message: "An error occurred. Budget was not created",
      });
    }

    res.status(201).json({ message: "Budget created successfully" });
  } catch (error) {
    console.log("Error:", error);
    return res.status(500).json({
      error: true,
      message: "An error occurred. Budget was not created",
    });
  }
}

// Delete a budget
export async function deleteBudget(req, res) {
  const { id } = req.params;
  try {
    const response = await connection.execute(
      "DELETE FROM budget WHERE budget_id = ?",
      [id]
    );
    if (response.length == 0) {
      return res.status(400).json({
        error: true,
        message: "An error occurred. Budget was not deleted",
      });
    }
    res.status(200).json({ message: "Budget was deleted successfully." });
  } catch (error) {
    console.log("Error:", error);
    return res.status(500).json({
      error: true,
      message: "An error occurred. Budget was not deleted.",
    });
  }
}
