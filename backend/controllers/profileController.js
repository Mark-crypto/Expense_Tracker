import connection from "../database.js";

// Get profile
export const getProfile = async (req, res) => {
  let { id } = req.params;
  id = parseInt(id);
  try {
    const [row] = await connection.execute(
      "SELECT user_id, name, email, goal, age,occupation FROM users WHERE user_id = ?",
      [id]
    );
    res
      .status(200)
      .json({ data: row[0], message: "Profile retrieved successfully." });
  } catch (error) {
    console.log("Error:", error);
    res.status(500).json({ error: true, message: "Something went wrong." });
  }
};

// Update profile
export const updateProfile = async (req, res) => {
  let { id } = req.params;
  id = parseInt(id);
  const { name, occupation, age, goal } = req.body;
  try {
    const response = await connection.execute(
      "UPDATE users SET name=?, occupation=?, age=?, goal=? WHERE user_id=?",
      [name, occupation, age, goal, id]
    );
    if (!response) {
      return res.status(400).json({
        error: true,
        message: "Something went wrong. Try again later.",
      });
    }
    res.status(200).json({ message: "Records updated successfully" });
  } catch (error) {
    console.log("Error:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
};

// Delete profile and everything that belongs to it
export const deleteProfile = async (req, res) => {
  const id = parseInt(req.params.id);
  const db = await connection.getConnection();
  try {
    await db.beginTransaction();
    for (const table of [
      "notifications",
      "expense",
      "budget",
      "subcategory_suggestions",
      "mpesa_transactions",
      "merchant_categories",
      "dismissed_bills",
      "recurring_payments",
      "recurring_price_changes",
      "bill_aliases",
      "budget_limits",
      "budget_changes",
      "budget_alerts",
      "account_balances",
      "account_income",
      "account_transfers",
      "accounts",
      "expense_shortcuts",
      "goal_moves",
      "savings_goals",
      "refresh_tokens",
      "users",
    ]) {
      await db.execute(`DELETE FROM ${table} WHERE user_id = ?`, [id]);
    }
    await db.commit();

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    await db.rollback();
    console.log("Error:", error);
    res.status(500).json({ message: "Something went wrong." });
  } finally {
    db.release();
  }
};
