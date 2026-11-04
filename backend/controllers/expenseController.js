import connection from "../database.js";
import ExcelJS from "exceljs";
import { chooseAccount, loadAccounts } from "../utils/accounts.js";
import { suggestCategory } from "../utils/extractMpesaLines.js";
import { parseMpesaSms } from "../utils/mpesaSms.js";
import { loadBudgets, ownBudgetId, refreshUserBudgets } from "../utils/budgetStatus.js";
import { loadTracked, recordRealPayments } from "../utils/recurring.js";
import { buildSafeToSpend } from "../utils/safeToSpend.js";

const LARGE_EXPENSE = 5000;
const isDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value ?? "");

// The same filters drive the list, its summary and the Excel export.
const buildFilter = (userId, query) => {
  const where = ["user_id = ?", "status = 'active'"];
  const params = [userId];
  const { q, from, to, category, source, view, merchant, min } = query;

  if (q) {
    where.push(
      "(LOWER(merchant) LIKE ? OR LOWER(description) LIKE ? OR LOWER(note) LIKE ? OR LOWER(subcategories) LIKE ? OR LOWER(category) LIKE ?)"
    );
    params.push(...Array(5).fill(`%${q.toLowerCase()}%`));
  }
  if (isDate(from)) {
    where.push("date_created >= ?");
    params.push(from);
  }
  if (isDate(to)) {
    where.push("date_created <= ?");
    params.push(to);
  }
  if (category) {
    where.push("category = ?");
    params.push(category);
  }
  if (source) {
    where.push("source = ?");
    params.push(source);
  }
  if (merchant) {
    where.push("merchant = ?");
    params.push(merchant);
  }
  if (Number(min) > 0) {
    where.push("amount >= ?");
    params.push(Number(min));
  }
  if (view === "review") where.push("needs_review = 1");
  if (view === "budgeted") where.push("budget_id IS NOT NULL");
  if (view === "large") {
    where.push("amount >= ?");
    params.push(LARGE_EXPENSE);
  }

  return { clause: where.join(" AND "), params };
};

export const getExpenseReport = async (req, res) => {
  const id = parseInt(req.user.userId);
  const { clause, params } = buildFilter(id, req.query);
  try {
    const [expenses] = await connection.execute(
      `SELECT * FROM expense WHERE ${clause} ORDER BY date_created DESC`,
      params
    );
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Expenses Report");

    sheet.columns = [
      { header: "Date", key: "date", width: 15 },
      { header: "Paid to", key: "merchant", width: 28 },
      { header: "Amount", key: "amount", width: 15 },
      { header: "Category", key: "category", width: 20 },
      { header: "Source", key: "source", width: 12 },
      { header: "Note", key: "note", width: 30 },
      { header: "Subcategories", key: "subcategories", width: 30 },
    ];
    expenses.forEach((exp) => {
      sheet.addRow({
        date: exp.date_created,
        merchant: exp.merchant,
        amount: exp.amount,
        category: exp.category,
        source: exp.source,
        note: exp.note,
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
  const limit = Math.min(parseInt(req.query._limit) || 10, 5000);
  const offset = (pageNumber - 1) * limit;
  const userId = parseInt(req.user.userId);
  const { clause, params } = buildFilter(userId, req.query);
  const sortColumn = req.query.sort === "amount" ? "amount" : "date_created";

  try {
    const [rows] = await connection.execute(
      `SELECT *, DATE_FORMAT(date_created, '%Y-%m-%d') AS date
      FROM expense WHERE ${clause}
      ORDER BY ${sortColumn} DESC, expense_id DESC LIMIT ? OFFSET ?`,
      [...params, limit.toString(), offset.toString()]
    );

    const [[totals]] = await connection.execute(
      `SELECT COUNT(*) AS total, COALESCE(SUM(amount), 0) AS spent FROM expense WHERE ${clause}`,
      params
    );
    const [[biggest]] = await connection.execute(
      `SELECT merchant, description, subcategories, amount FROM expense WHERE ${clause} ORDER BY amount DESC LIMIT 1`,
      params
    );
    const [byCategory] = await connection.execute(
      `SELECT category, SUM(amount) AS total FROM expense WHERE ${clause} GROUP BY category`,
      params
    );
    const [daily] = await connection.execute(
      `SELECT DATE_FORMAT(date_created, '%Y-%m-%d') AS date, SUM(amount) AS total
      FROM expense WHERE ${clause} AND date_created >= CURDATE() - INTERVAL 29 DAY
      GROUP BY date ORDER BY date`,
      params
    );
    const [[{ toReview }]] = await connection.execute(
      "SELECT COUNT(*) AS toReview FROM expense WHERE user_id = ? AND status = 'active' AND needs_review = 1",
      [userId]
    );

    res.status(200).json({
      data: rows,
      meta: {
        pageNumber,
        limit,
        totalPages: Math.ceil(totals.total / limit),
        total: totals.total,
      },
      summary: {
        count: totals.total,
        total: Number(totals.spent),
        toReview,
        biggest: biggest ? { ...biggest, amount: Number(biggest.amount) } : null,
        byCategory: byCategory.map((row) => ({ ...row, total: Number(row.total) })),
        daily: daily.map((row) => ({ ...row, total: Number(row.total) })),
      },
    });
  } catch (error) {
    console.log("Error:", error);
    return res.status(500).json({
      error: true,
      message: "An error occurred. No expenses were found.",
    });
  }
};

export const updateExpense = async (req, res) => {
  const userId = parseInt(req.user.userId);
  const expenseId = parseInt(req.params.id);
  const { amount, category, date, merchant, note, budgetId, accountId } = req.body;

  try {
    const [[expense]] = await connection.execute(
      "SELECT subcategories, account_id FROM expense WHERE expense_id = ? AND user_id = ? AND status = 'active'",
      [expenseId, userId]
    );
    if (!expense) {
      return res.status(404).json({ error: true, message: "Expense not found." });
    }

    if (budgetId) {
      const [[owned]] = await connection.execute(
        "SELECT budget_id FROM budget WHERE budget_id = ? AND user_id = ?",
        [budgetId, userId]
      );
      if (!owned) {
        return res.status(404).json({ error: true, message: "Budget not found." });
      }
    }

    // A single item always equals the expense, so keep the two in step.
    let items = [];
    try {
      items = JSON.parse(expense.subcategories) ?? [];
    } catch {
      items = [];
    }
    if (items.length === 1) items[0].amount = Number(amount);

    await connection.execute(
      `UPDATE expense SET amount = ?, category = ?, date_created = ?, month = ?, merchant = ?,
        note = ?, budget_id = ?, budgeted = ?, subcategories = ?, needs_review = 0, account_id = ?
      WHERE expense_id = ?`,
      [
        amount,
        category,
        date,
        new Date(date).toLocaleString("default", { month: "long" }),
        merchant?.trim() || null,
        note?.trim() || null,
        budgetId ?? null,
        budgetId ? 1 : 0,
        JSON.stringify(items),
        accountId === undefined ? expense.account_id : await chooseAccount(connection, userId, accountId),
        expenseId,
      ]
    );

    await refreshUserBudgets(userId, req.user.email);

    res.status(200).json({ message: "Expense updated." });
  } catch (error) {
    console.log("Error:", error);
    return res.status(500).json({
      error: true,
      message: "An error occurred. Expense was not updated.",
    });
  }
};

export const bulkUpdateExpenses = async (req, res) => {
  const userId = parseInt(req.user.userId);
  const { ids, action, category, budgetId } = req.body;

  try {
    if (action === "budget" && budgetId) {
      const [[owned]] = await connection.execute(
        "SELECT budget_id FROM budget WHERE budget_id = ? AND user_id = ?",
        [budgetId, userId]
      );
      if (!owned) {
        return res.status(404).json({ error: true, message: "Budget not found." });
      }
    }

    const changes = {
      category: ["category = ?, needs_review = 0", [category]],
      budget: ["budget_id = ?, budgeted = ?", [budgetId ?? null, budgetId ? 1 : 0]],
      confirm: ["needs_review = 0", []],
      delete: ["status = 'inactive'", []],
      restore: ["status = 'active'", []],
    };
    const [set, values] = changes[action];
    const [result] = await connection.query(
      `UPDATE expense SET ${set} WHERE user_id = ? AND expense_id IN (?)`,
      [...values, userId, ids]
    );

    await refreshUserBudgets(userId, req.user.email);

    res.status(200).json({ updated: result.affectedRows });
  } catch (error) {
    console.log("Error:", error);
    return res.status(500).json({
      error: true,
      message: "An error occurred. Nothing was changed.",
    });
  }
};

export const getMerchantHistory = async (req, res) => {
  const userId = parseInt(req.user.userId);
  try {
    const [[history]] = await connection.execute(
      "SELECT COUNT(*) AS count, COALESCE(SUM(amount), 0) AS total FROM expense WHERE user_id = ? AND merchant = ? AND status = 'active'",
      [userId, req.query.name ?? ""]
    );
    res.status(200).json({ count: history.count, total: Number(history.total) });
  } catch (error) {
    console.log("Error:", error);
    return res.status(500).json({ error: true, message: "Something went wrong." });
  }
};

// What the Add expense page needs: known merchants, most recent first, the budget each
// category counts toward this month, account balances, today's Safe to spend and the
// last few expenses, so it can show what a new expense would change before it's saved.
export const getQuickAdd = async (req, res) => {
  const userId = parseInt(req.user.userId);
  try {
    const [merchants] = await connection.execute(
      `SELECT e.merchant, COALESCE(m.category, MAX(e.category)) AS category
      FROM expense e
      LEFT JOIN merchant_categories m ON m.user_id = e.user_id AND m.merchant = e.merchant
      WHERE e.user_id = ? AND e.status = 'active' AND e.merchant IS NOT NULL AND e.merchant <> 'M-Pesa'
      GROUP BY e.merchant, m.category
      ORDER BY MAX(e.date_created) DESC, MAX(e.expense_id) DESC
      LIMIT 100`,
      [userId]
    );
    const { budgets } = await loadBudgets(userId);
    const today = new Date().toLocaleDateString("en-CA");
    const live = budgets.filter(
      (budget) =>
        budget.status !== "inactive" &&
        (!budget.has_time_limit ||
          ((!budget.startDate || today >= budget.startDate) && (!budget.endDate || today <= budget.endDate)))
    );
    const byCategory = {};
    for (const { budget_id, category, name, limit, spent } of live) {
      byCategory[category] ??= { id: budget_id, name, limit, spent, left: limit - spent };
    }
    const money = await loadAccounts(userId);
    const accounts = money.accounts.map(({ id, name, type, balance }) => ({ id, name, type, balance }));
    const safe = await buildSafeToSpend(userId, money.accounts, await loadTracked(userId));
    const [recentExpenses] = await connection.execute(
      `SELECT expense_id AS id, amount, merchant, category, account_id, DATE_FORMAT(date_created, '%Y-%m-%d') AS date
      FROM expense WHERE user_id = ? AND status = 'active' AND merchant IS NOT NULL
      ORDER BY date_created DESC, expense_id DESC LIMIT 5`,
      [userId]
    );
    const [used] = await connection.execute(
      `SELECT merchant, account_id FROM expense
      WHERE user_id = ? AND status = 'active' AND merchant IS NOT NULL AND account_id IS NOT NULL
      ORDER BY date_created, expense_id`,
      [userId]
    );
    const [shortcuts] = await connection.execute(
      "SELECT id, merchant, category, account_id FROM expense_shortcuts WHERE user_id = ? ORDER BY merchant",
      [userId]
    );
    res.status(200).json({
      merchants,
      budgets: byCategory,
      budgetList: live.map(({ budget_id: id, name, category, limit, spent }) => ({ id, name, category, limit, spent, left: limit - spent })),
      accounts,
      safe: safe.ready ? { leftToday: safe.leftToday, daily: safe.daily } : null,
      recent: recentExpenses.map((row) => ({ ...row, amount: Number(row.amount) })),
      shortcuts,
      lastAccounts: Object.fromEntries(used.map((row) => [row.merchant.toLowerCase(), row.account_id])),
    });
  } catch (error) {
    console.log("Error:", error);
    return res.status(500).json({ error: true, message: "Something went wrong." });
  }
};

// Reads a pasted M-Pesa message into an expense, and flags one already added.
export const parseSms = async (req, res) => {
  const userId = parseInt(req.user.userId);
  const found = parseMpesaSms(req.body.text);
  if (!found) {
    return res.status(422).json({
      error: true,
      message: "That doesn't look like an M-Pesa payment message. Copy the whole SMS from Safaricom.",
    });
  }
  try {
    const [[remembered]] = await connection.execute(
      "SELECT category FROM merchant_categories WHERE user_id = ? AND LOWER(merchant) = LOWER(?)",
      [userId, found.merchant]
    );
    const [[existing]] = await connection.execute(
      "SELECT DATE_FORMAT(date_created, '%Y-%m-%d') AS date FROM expense WHERE user_id = ? AND receipt_no = ? AND status = 'active'",
      [userId, found.receiptNo]
    );
    res.status(200).json({
      ...found,
      category: remembered?.category ?? suggestCategory(found.kind, found.merchant),
      duplicate: existing?.date ?? null,
    });
  } catch (error) {
    console.log("Error:", error);
    return res.status(500).json({ error: true, message: "Something went wrong." });
  }
};

export const saveShortcut = async (req, res) => {
  const userId = parseInt(req.user.userId);
  const { merchant, category, accountId } = req.body;
  try {
    await connection.execute(
      `INSERT INTO expense_shortcuts (user_id, merchant, category, account_id) VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE category = VALUES(category), account_id = VALUES(account_id)`,
      [userId, merchant.trim(), category, accountId ?? null]
    );
    res.status(201).json({ message: "Shortcut saved." });
  } catch (error) {
    console.log("Error:", error);
    return res.status(500).json({ error: true, message: "This shortcut could not be saved." });
  }
};

export const deleteShortcut = async (req, res) => {
  try {
    await connection.execute("DELETE FROM expense_shortcuts WHERE id = ? AND user_id = ?", [
      req.params.id,
      parseInt(req.user.userId),
    ]);
    res.status(200).json({ message: "Shortcut removed." });
  } catch (error) {
    console.log("Error:", error);
    return res.status(500).json({ error: true, message: "This shortcut could not be removed." });
  }
};

export const applyMerchantCategory = async (req, res) => {
  const userId = parseInt(req.user.userId);
  const { merchant, category } = req.body;
  try {
    const [result] = await connection.execute(
      "UPDATE expense SET category = ?, needs_review = 0 WHERE user_id = ? AND merchant = ? AND status = 'active'",
      [category, userId, merchant]
    );
    await connection.execute(
      `INSERT INTO merchant_categories (user_id, merchant, category) VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE category = VALUES(category)`,
      [userId, merchant, category]
    );
    await refreshUserBudgets(userId, req.user.email);
    res.status(200).json({ updated: result.affectedRows });
  } catch (error) {
    console.log("Error:", error);
    return res.status(500).json({ error: true, message: "Something went wrong." });
  }
};

export const createExpense = async (req, res) => {
  const { amount, category, date, subcategories, budgeted, budgetNames, budgetId, merchant, accountId, receiptNo } =
    req.body;
  const merchantName = merchant?.trim() || null;
  const isBudgeted = budgeted ? 1 : 0;
  const month = new Date(date).toLocaleString("default", { month: "long" });
  const userId = parseInt(req.user.userId);

  try {
    if (subcategories && Array.isArray(subcategories)) {
      // A single item is named after the merchant, which isn't a useful suggestion.
      const items = subcategories.filter(({ name }) => name !== merchantName);
      await processSubcategories(items, category, userId);
    }
    const [budgetID] = await connection.execute(
      `SELECT budget_id FROM budget WHERE name = ? AND user_id = ?`,
      [budgetNames ?? null, userId]
    );
    // A budget picked on the Add expense page wins; otherwise the category decides later.
    const budgetIdValue = (await ownBudgetId(userId, budgetId)) ?? (budgetID.length > 0 ? budgetID[0].budget_id : null);

    const [response] = await connection.execute(
      "INSERT INTO expense (amount , category , date_created, month, user_id, subcategories, budgeted, budget_id, merchant, account_id, receipt_no, source) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)",
      [
        amount,
        category,
        date,
        month,
        userId,
        JSON.stringify(subcategories),
        budgetIdValue ? 1 : isBudgeted,
        budgetIdValue,
        merchantName,
        await chooseAccount(connection, userId, accountId),
        receiptNo ?? null,
        receiptNo ? "sms" : "manual",
      ]
    );

    if (response.affectedRows == 0) {
      return res.status(400).json({
        error: true,
        message: "An error occurred. Expense was not created.",
      });
    }

    if (merchantName) {
      await connection.execute(
        `INSERT INTO merchant_categories (user_id, merchant, category) VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE category = VALUES(category)`,
        [userId, merchantName, category]
      );
      await recordRealPayments(connection, userId, [
        { name: merchantName, date: String(date).slice(0, 10), amount: Number(amount) },
      ]);
    }

    await refreshUserBudgets(userId, req.user.email);
    res.status(201).json({ message: "Expense added successfully" });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: true, message: "You've already added this payment." });
    }
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
    await connection.execute(
      "UPDATE expense SET status = 'inactive' WHERE user_id = ?",
      [userId]
    );
    await connection.execute(
      "DELETE FROM mpesa_transactions WHERE user_id = ?",
      [userId]
    );
    await refreshUserBudgets(userId, req.user.email);
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
      "SELECT expense_id FROM expense WHERE expense_id = ? AND user_id = ? AND status = 'active'",
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
    await refreshUserBudgets(userId, req.user.email);
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
