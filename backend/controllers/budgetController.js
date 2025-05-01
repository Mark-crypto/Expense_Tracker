import connection from "../database.js";
//GET ID FROM req.userInfo

// Get all budgets
export async function getBudget(req, res) {
  const limit = parseInt(req.query._limit) || 10;
  const page = parseInt(req.query._page) || 1;
  const offset = (page - 1) * limit;

  const offsetString = offset.toString();
  const limitString = limit.toString();
  try {
    const [rows] = await connection.execute(
      "SELECT * FROM budget LIMIT ? OFFSET ?",
      [limitString, offsetString]
    );
    const [totalItems] = await connection.execute(
      "SELECT COUNT(*) AS total FROM budget"
    );
    const total = totalItems[0]?.total || 0;
    res.status(200).json({
      data: rows,
      meta: { totalPages: Math.ceil(total / limit), page, limit, total },
    });
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
  const send_email = email_checked ? "checked" : "unchecked";
  try {
    const [response] = await connection.execute(
      "INSERT INTO budget (name,category, amount, email_checked, user_id ) VALUES(?,?,?,?,?)",
      [name, category, amount, send_email, 1]
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
