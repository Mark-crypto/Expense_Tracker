import connection from "../database.js";

// Get all budgets
export async function getBudget(req, res) {
  try {
    const [rows] = await connection.execute("SELECT * FROM budget");
    res.status(200).json({ data: rows });
  } catch (error) {
    console.log("Error:", error);
    return res.status(500).json({ error: true, message: "An error occurred" });
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
    return res.json({ error: true, message: "An error occurred" });
  }
}

// Add a budget
export async function addBudget(req, res) {
  const { name, category, amount, email_checked } = req.body;
  try {
    const response = await connection.execute(
      "INSERT INTO budget SET name = ?,category = ?, amount = ?, email_checked = ?",
      [name, category, amount, email_checked]
    );
    if (!response) {
      return res.send(500).json({ error: true, message: "An error occurred" });
    }

    res.status(201).json({ message: "Budget created successfully" });
  } catch (error) {
    console.log("Error:", error);
    return res.status(500).json({ error: true, message: "An error occurred" });
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
    if (!response) {
      return res.send(500).json({ error: true, message: "An error occurred" });
    }
    res.send(500).json({ error: true, message: "An error occurred" });
  } catch (error) {
    console.log("Error:", error);
    return res.status(500).json({ error: true, message: "An error occurred" });
  }
}
