import connection from "../database.js";
import { sendEmail } from "../utils/emailAlert.js";
import ExcelJS from "exceljs";
import { refreshBudgetStatus } from "../utils/budgetStatus.js";

export const getExpenseReport = async (req, res) => {
  const id = parseInt(req.user.userId);
  try {
    const [expenses] = await connection.execute(
      `SELECT * FROM expense WHERE user_id = ? AND status = 'active'`,
      [id]
    );
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Expenses Report");

    sheet.columns = [
      { header: "Amount", key: "amount", width: 15 },
      { header: "Category", key: "category", width: 20 },
      { header: "Date", key: "date", width: 15 },
      { header: "Subcategories", key: "subcategories", width: 30 },
    ];
    expenses.forEach((exp) => {
      sheet.addRow({
        date: exp.date_created,
        category: exp.category,
        amount: exp.amount,
        subcategories: exp.subcategories,
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=expenses.xlsx");
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.log("Error downloading expense report", error);
    return res.status(500).json({
      error: true,
      message: "An error occurred while downloading the expense report.",
    });
  }
};

export const getExpenses = async (req, res) => {
  const pageNumber = parseInt(req.query._page) || 1;
  const limit = parseInt(req.query._limit) || 10;
  const offset = (pageNumber - 1) * limit;
  const userId = parseInt(req.user.userId);

  const limitString = limit.toString();
  const offsetString = offset.toString();

  try {
    const [rows] = await connection.execute(
      `SELECT * FROM expense WHERE user_id = ? AND status = 'active' ORDER BY date_created DESC LIMIT ? OFFSET ?`,
      [userId, limitString, offsetString]
    );

    const [countResult] = await connection.execute(
      "SELECT COUNT(*) AS total FROM expense WHERE user_id = ? AND status = 'active'",
      [userId]
    );

    const total = countResult[0]?.total || 0;
    res.status(200).json({
      data: rows,
      meta: { pageNumber, limit, totalPages: Math.ceil(total / limit), total },
    });
  } catch (error) {
    console.log("Error:", error);
    return res.status(500).json({
      error: true,
      message: "An error occurred. No expenses were found.",
    });
  }
};

export const createExpense = async (req, res) => {
  const { amount, category, date, subcategories, budgeted, budgetNames } =
    req.body;
  const isBudgeted = budgeted ? 1 : 0;
  const month = new Date(date).toLocaleString("default", { month: "long" });
  const userId = parseInt(req.user.userId);

  try {
    if (subcategories && Array.isArray(subcategories)) {
      await processSubcategories(subcategories, category, userId);
    }
    const [budgetID] = await connection.execute(
      `SELECT budget_id FROM budget WHERE name = ? AND user_id = ?`,
      [budgetNames ?? null, userId]
    );
    const budgetIdValue = budgetID.length > 0 ? budgetID[0].budget_id : null;

    const [response] = await connection.execute(
      "INSERT INTO expense (amount , category , date_created, month, user_id, subcategories, budgeted, budget_id) VALUES(?,?,?,?,?,?,?,?)",
      [
        amount,
        category,
        date,
        month,
        userId,
        JSON.stringify(subcategories),
        isBudgeted,
        budgetIdValue,
      ]
    );

    if (response.affectedRows == 0) {
      return res.status(400).json({
        error: true,
        message: "An error occurred. Expense was not created.",
      });
    }

    if (budgetIdValue) {
      const [[budget]] = await connection.execute(
        `SELECT budget_id, name, amount, email_checked, notify_email, status FROM budget WHERE budget_id = ? AND user_id = ?`,
        [budgetIdValue, userId]
      );

      const [[{ total_spent }]] = await connection.execute(
        `SELECT COALESCE(SUM(amount), 0) AS total_spent FROM expense WHERE budget_id = ? AND status = 'active'`,
        [budgetIdValue]
      );

      if (
        Number(budget.amount) < Number(total_spent) &&
        budget.status !== "exceeded"
      ) {
        await connection.execute(
          `UPDATE budget SET status = 'exceeded' WHERE budget_id = ?`,
          [budgetIdValue]
        );
        const message = `Your budget "${
          budget.name
        }" has been exceeded by KES ${
          total_spent - budget.amount
        }. You have spent a total of KES ${total_spent}, which is over your budget amount of KES ${
          budget.amount
        }. Please review your expenses.`;
        const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; padding: 20px; border-radius: 8px;">
        <h2 style="color: #d32f2f;">Budget Limit Exceeded</h2>
        <p>Hi ${req.user?.name.toUpperCase() || "there"},</p>
        <p>
          Your budget for <strong style="color: #1565c0;">${
            budget.name
          }</strong> 
          has been <strong style="color: #d32f2f;">exceeded</strong> by 
          <strong>KES ${(
            total_spent - budget.amount
          ).toLocaleString()}</strong>.
        </p>

        <p>
          You have spent a total of 
          <strong style="color: #2e7d32;">KES ${total_spent.toLocaleString()}</strong>, 
          which is over your budget limit of 
          <strong style="color: #d32f2f;">KES ${budget.amount.toLocaleString()}</strong>.
        </p>

        <p style="margin-top: 20px;">
          Please review your expenses to stay on track.
        </p>

        <hr style="margin: 25px 0; border: none; border-top: 1px solid #ddd;">
        <p style="font-size: 12px; color: #777;">
          This is an automated message from Budget Tracker. Please do not reply to this email.
        </p>
      </div>
`;

        if (budget.email_checked === "checked") {
          const email = req.user.email;
          const title = "BUDGET LIMIT EXCEEDED ALERT";

          await sendEmail(email, title, message, html, budgetIdValue);
        }

        const [[existingNotification]] = await connection.execute(
          `SELECT id FROM notifications WHERE user_id = ? AND budget_id = ? AND type = 'budget_exceeded' AND status = 'unread'`,
          [userId, budgetIdValue]
        );

        if (!existingNotification) {
          await connection.execute(
            `INSERT INTO notifications (user_id, budget_id, type, message) VALUES (?, ?, 'budget_exceeded', ?)`,
            [userId, budgetIdValue, message]
          );
        }
      }
    }
    res.status(201).json({ message: "Expense added successfully" });
  } catch (error) {
    console.log("Error:", error);
    return res.status(500).json({
      error: true,
      message: "An error occurred, Expense was not created.",
    });
  }
};

export const clearExpenses = async (req, res) => {
  const userId = parseInt(req.user.userId);
  try {
    const [budgets] = await connection.execute(
      "SELECT DISTINCT budget_id FROM expense WHERE user_id = ? AND status = 'active' AND budget_id IS NOT NULL",
      [userId]
    );
    await connection.execute(
      "UPDATE expense SET status = 'inactive' WHERE user_id = ?",
      [userId]
    );
    for (const { budget_id } of budgets) {
      await refreshBudgetStatus(budget_id);
    }
    res.status(200).json({ message: "Expense history cleared." });
  } catch (error) {
    console.log("Error: ", error);
    return res.status(500).json({
      error: true,
      message: "An error occurred. Expenses were not cleared.",
    });
  }
};

export const deleteExpense = async (req, res) => {
  const userId = parseInt(req.user.userId);
  const expenseId = parseInt(req.params.id);
  try {
    const [[expense]] = await connection.execute(
      "SELECT budget_id FROM expense WHERE expense_id = ? AND user_id = ? AND status = 'active'",
      [expenseId, userId]
    );
    if (!expense) {
      return res.status(404).json({
        error: true,
        message: "Expense not found.",
      });
    }

    await connection.execute(
      "UPDATE expense SET status = 'inactive' WHERE expense_id = ?",
      [expenseId]
    );
    if (expense.budget_id) {
      await refreshBudgetStatus(expense.budget_id);
    }
    res.status(200).json({ message: "Expense deleted." });
  } catch (error) {
    console.log("Error: ", error);
    return res.status(500).json({
      error: true,
      message: "An error occurred. Expense was not deleted.",
    });
  }
};

export const getSubcategorySuggestions = async (req, res) => {
  const { search, category, limit = 4 } = req.query;
  const userId = parseInt(req.user.userId);

  try {
    if (!category) {
      return res.status(400).json({
        error: true,
        message: "Category is required",
      });
    }

    if (!search || search.length < 2) {
      return res.status(200).json([]);
    }

    const searchTerm = `%${search}%`;
    const limitString = limit.toString();

    const [suggestions] = await connection.execute(
      `SELECT subcategory FROM subcategory_suggestions 
       WHERE category = ? AND subcategory LIKE ?
         AND (user_id IS NULL OR user_id = ?)
       ORDER BY 
         CASE WHEN subcategory = ? THEN 1 
              WHEN subcategory LIKE ? THEN 2 
              ELSE 3 
         END,
         subcategory
       LIMIT ?`,
      [category, searchTerm, userId, search, `${search}%`, limitString]
    );

    const suggestionList = suggestions.map((row) => row.subcategory);

    res.status(200).json(suggestionList);
  } catch (error) {
    console.log("Error fetching subcategory suggestions:", error);
    return res.status(500).json({
      error: true,
      message: "An error occurred while fetching suggestions.",
    });
  }
};

const processSubcategories = async (subcategories, category, userId) => {
  try {
    for (const subcategory of subcategories) {
      const { name } = subcategory;

      if (name && name.trim()) {
        const cleanName = name.trim();

        const [existing] = await connection.execute(
          "SELECT id FROM subcategory_suggestions WHERE category = ? AND subcategory = ? AND (user_id IS NULL OR user_id = ?)",
          [category, cleanName, userId]
        );

        if (existing.length === 0) {
          await connection.execute(
            "INSERT INTO subcategory_suggestions (subcategory, category, user_id) VALUES (?, ?, ?)",
            [cleanName, category, userId]
          );
        }
      }
    }
  } catch (error) {
    console.log("Error processing subcategories:", error);
  }
};

export const getAllSubcategoriesForCategory = async (req, res) => {
  const { category } = req.params;
  const userId = parseInt(req.user.userId);

  try {
    const [subcategories] = await connection.execute(
      "SELECT subcategory FROM subcategory_suggestions WHERE category = ? AND (user_id IS NULL OR user_id = ?) ORDER BY subcategory",
      [category, userId]
    );

    res.status(200).json({
      data: subcategories,
      meta: { total: subcategories.length },
    });
  } catch (error) {
    console.log("Error fetching subcategories for category:", error);
    return res.status(500).json({
      error: true,
      message: "An error occurred while fetching subcategories.",
    });
  }
};

export const addSubcategorySuggestion = async (req, res) => {
  const { subcategory, category } = req.body;
  const userId = parseInt(req.user.userId);

  try {
    if (!subcategory || !category) {
      return res.status(400).json({
        error: true,
        message: "Both subcategory and category are required",
      });
    }

    const [existing] = await connection.execute(
      "SELECT id FROM subcategory_suggestions WHERE category = ? AND subcategory = ? AND (user_id IS NULL OR user_id = ?)",
      [category, subcategory.trim(), userId]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        error: true,
        message: "Subcategory already exists for this category",
      });
    }

    const [response] = await connection.execute(
      "INSERT INTO subcategory_suggestions (subcategory, category, user_id) VALUES (?, ?, ?)",
      [subcategory.trim(), category, userId]
    );

    res.status(201).json({
      message: "Subcategory suggestion added successfully",
      id: response.insertId,
    });
  } catch (error) {
    console.log("Error adding subcategory suggestion:", error);
    return res.status(500).json({
      error: true,
      message: "An error occurred while adding the subcategory suggestion.",
    });
  }
};
