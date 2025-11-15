import connection from "../database.js";
import ExcelJS from "exceljs";

export const getBudgetReport = async (req, res) => {
  const id = parseInt(req.user.userId);
  try {
    const [budgets] = await connection.execute(
      `SELECT * FROM budget WHERE user_id = ?`,
      [id]
    );
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Budgets Report");

    sheet.columns = [
      { header: "Name", key: "name", width: 15 },
      { header: "Category", key: "category", width: 20 },
      { header: "Amount", key: "amount", width: 15 },
      { header: "Email", key: "email", width: 30 },
      { header: "Subcategories", key: "subcategories", width: 30 },
    ];

    budgets.forEach((budget) => {
      sheet.addRow({
        name: budget.name,
        category: budget.category,
        amount: budget.amount,
        email: budget.email,
        subcategories: budget.subcategories,
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=budgets.xlsx");
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.log("Error during budget report generation:", error);
    return res.status(500).json({
      error: true,
      message: "An error occurred while generating the budget report.",
    });
  }
};

// Get all budgets
export async function getBudgetNames(req, res) {
  const id = parseInt(req.user.userId);
  try {
    const [rows] = await connection.execute(
      "SELECT budget_id,name FROM budget WHERE user_id = ?",
      [id]
    );
    res.status(200).json({ data: rows });
  } catch (error) {
    console.log("Error:", error);
    return res.status(500).json({
      error: true,
      message: "An error occurred. No budget names were found.",
    });
  }
}
export async function getBudget(req, res) {
  const id = parseInt(req.user.userId);

  const limit = parseInt(req.query._limit) || 10;
  const page = parseInt(req.query._page) || 1;
  const offset = (page - 1) * limit;

  const offsetString = offset.toString();
  const limitString = limit.toString();
  try {
    const [rows] = await connection.execute(
      "SELECT * FROM budget WHERE user_id = ? LIMIT ? OFFSET ?",
      [id, limitString, offsetString]
    );
    const [totalItems] = await connection.execute(
      "SELECT COUNT(*) AS total FROM budget WHERE user_id = ?",
      [id]
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
  const id = parseInt(req.query.id);
  const userId = parseInt(req.user.userId);
  try {
    const [rows] = await connection.execute(
      "SELECT * FROM budget WHERE budget_id = ? AND user_id = ?",
      [id, userId]
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
  const userId = parseInt(req.user.userId);
  const {
    name,
    category,
    amount,
    email,
    subcategories,
    startDate,
    endDate,
    timeLimit,
  } = req.body;
  const send_email = email ? "checked" : "unchecked";
  try {
    const [response] = await connection.execute(
      "INSERT INTO budget (name,category, amount, email_checked, user_id, subcategories, start_date, end_date, has_time_limit) VALUES(?,?,?,?,?,?,?,?,?)",
      [
        name,
        category,
        amount,
        send_email,
        userId,
        JSON.stringify(subcategories),
        startDate,
        endDate,
        timeLimit,
      ]
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
  const userId = parseInt(req.user.userId);
  const { id } = req.params;
  try {
    const response = await connection.execute(
      "DELETE FROM budget WHERE budget_id = ? AND user_id = ?",
      [id, userId]
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

/**
 * 
 * SELECT 
  b.id AS budget_id,
  b.user_id,
  b.category,
  b.limit_amount,
  b.has_time_limit,
  b.start_date,
  b.end_date,
  b.status,
  COALESCE(SUM(
    CASE 
      WHEN b.has_time_limit = 1 
           AND e.created_at BETWEEN b.start_date AND b.end_date 
           THEN e.amount
      WHEN b.has_time_limit = 0 
           THEN e.amount
      ELSE 0
    END
  ), 0) AS total_spent,
  (b.limit_amount - COALESCE(SUM(
    CASE 
      WHEN b.has_time_limit = 1 
           AND e.created_at BETWEEN b.start_date AND b.end_date 
           THEN e.amount
      WHEN b.has_time_limit = 0 
           THEN e.amount
      ELSE 0
    END
  ), 0)) AS remaining_balance
FROM budgets b
LEFT JOIN expenses e 
  ON e.user_id = b.user_id
  AND e.category = b.category
  AND e.budgeted = 1
WHERE b.user_id = ?
GROUP BY b.id, b.limit_amount, b.has_time_limit, b.start_date, b.end_date, b.status;

 */

/**
 * UPDATE budgets b
JOIN (
  SELECT b.id, 
         COALESCE(SUM(
           CASE 
             WHEN b.has_time_limit = 1 
                  AND e.created_at BETWEEN b.start_date AND b.end_date 
                  THEN e.amount
             WHEN b.has_time_limit = 0 
                  THEN e.amount
             ELSE 0
           END
         ), 0) AS total_spent
  FROM budgets b
  LEFT JOIN expenses e 
    ON e.user_id = b.user_id
    AND e.category = b.category
    AND e.budgeted = 1
  GROUP BY b.id
) x ON x.id = b.id
SET b.status = CASE WHEN x.total_spent > b.limit_amount THEN 'exceeded' ELSE 'active' END;

 */
