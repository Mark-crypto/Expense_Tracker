import connection from "../database.js";

// Get all budgets
export function getBudget(req, res) {
  try {
    connection.execute("SELECT * FROM budget", (error, data) => {
      if (error) {
        return res
          .status(500)
          .json({ error: true, message: "Error fetching budgets" });
      }
      return res.status(200).json({ data });
    });
  } catch (error) {
    return res
      .status(500)
      .json({ error: true, message: "Error fetching budgets" });
  }
}

// Get a single budget
export function getSingleBudget(req, res) {
  const { id } = req.params;
  try {
    connection.execute(
      "SELECT * FROM budget WHERE budget_id = ?",
      [id],
      (error, data) => {
        if (error) {
          return res
            .status(500)
            .json({ error: true, message: "Error fetching budget" });
        }
        return res.json({ data: data[0] });
      }
    );
  } catch (error) {
    return res.json({ error: true, message: "Error fetching budget" });
  }
}

// Add a budget
export function addBudget(req, res) {
  const { name, category, amount, email_checked } = req.body;
  try {
    connection.execute(
      "INSERT INTO budget SET name = ?,category = ?, amount = ?, email_checked = ?",
      [name, category, amount, email_checked],
      (error, data) => {
        if (error) {
          return res
            .status(500)
            .json({ error: true, message: "Error adding budget" });
        }
        return res
          .status(201)
          .json({ message: "Budget added successfully", data });
      }
    );
  } catch (error) {
    return res
      .status(500)
      .json({ error: true, message: "Error adding budget" });
  }
}

// Delete a budget
export function deleteBudget(req, res) {
  const { id } = req.params;
  try {
    connection.execute(
      "DELETE FROM budget WHERE budget_id = ?",
      [id],
      (error, data) => {
        if (error) {
          return res
            .status(500)
            .json({ error: true, message: "Error deleting budget" });
        }
        return res
          .status(200)
          .json({ message: "Budget deleted successfully", data });
      }
    );
  } catch (error) {
    return res
      .status(500)
      .json({ error: true, message: "Error deleting budget" });
  }
}
