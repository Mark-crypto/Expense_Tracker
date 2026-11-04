import connection from "../database.js";
import ExcelJS from "exceljs";
import {
  buildPlan,
  buildPlanSummary,
  buildReview,
  committedByCategory,
  isRegular,
  loadChanges,
  regularBudgetFor,
  saveLimit,
  suggestedLimit,
} from "../utils/budgetPlans.js";
import { currentMonth, loadAlertSettings, loadBudgets, refreshUserBudgets, shiftMonth } from "../utils/budgetStatus.js";

const ownBudget = async (userId, id) =>
  (await loadBudgets(userId)).budgets.find((budget) => budget.budget_id === Number(id));

const clashMessage = (category, name) => `${name.replace(/\b\w/g, (c) => c.toUpperCase())} already covers this category. Edit it, or pause it first.`;

const insertBudget = async (userId, { name, category, amount, subcategories, startDate, endDate, period = "monthly", rollover, alertMode, warnAt }) => {
  const once = period === "once";
  const [result] = await connection.execute(
    `INSERT INTO budget (name, category, amount, email_checked, user_id, subcategories, start_date, end_date, has_time_limit, period, rollover, alert_mode, warn_at)
    VALUES (?, ?, ?, 'checked', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      name,
      category,
      amount,
      userId,
      JSON.stringify(subcategories ?? []),
      once ? (startDate ?? null) : null,
      once ? (endDate ?? null) : null,
      once ? 1 : 0,
      period,
      rollover && period === "monthly" ? 1 : 0,
      alertMode ?? null,
      warnAt ?? null,
    ]
  );
  await connection.execute(
    "INSERT INTO budget_limits (budget_id, user_id, from_month, only_month, amount) VALUES (?, ?, ?, 0, ?)",
    [result.insertId, userId, currentMonth(), amount]
  );
  return result.insertId;
};

const MAX_REPORT_MONTHS = 36;
const isMonth = (value) => /^\d{4}-\d{2}$/.test(value ?? "");

// One row per budget per month in the chosen period: its limit, what was spent and what was left.
export const getBudgetReport = async (req, res) => {
  const id = parseInt(req.user.userId);
  const to = isMonth(req.query.to?.slice(0, 7)) ? req.query.to.slice(0, 7) : currentMonth();
  const wanted = isMonth(req.query.from?.slice(0, 7)) ? req.query.from.slice(0, 7) : to;
  const from = wanted > to ? to : wanted;
  try {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Budgets");
    sheet.columns = [
      { header: "Month", key: "month", width: 12 },
      { header: "Budget", key: "name", width: 22 },
      { header: "Category", key: "category", width: 22 },
      { header: "Period", key: "period", width: 10 },
      { header: "Limit (KES)", key: "limit", width: 14 },
      { header: "Spent (KES)", key: "spent", width: 14 },
      { header: "Left (KES)", key: "left", width: 14 },
      { header: "Result", key: "result", width: 12 },
    ];
    sheet.getRow(1).font = { bold: true };

    for (let month = from, count = 0; month <= to && count < MAX_REPORT_MONTHS; month = shiftMonth(month, 1), count++) {
      const { budgets } = await loadBudgets(id, month);
      budgets
        .filter((budget) => budget.firstMonth <= month && budget.status !== "inactive")
        .forEach((budget) => {
          const left = Math.round((budget.limit - budget.spent) * 100) / 100;
          sheet.addRow({
            month,
            name: budget.name,
            category: budget.category,
            period: budget.period,
            limit: budget.limit,
            spent: budget.spent,
            left,
            result: left < 0 ? "Over" : "Within",
          });
        });
    }
    if (sheet.rowCount === 1) sheet.addRow({ month: "No budgets in this period" });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=budgets-${from}-to-${to}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.log("Error during budget report generation:", error);
    return res.status(500).json({ error: true, message: "The budget report could not be made." });
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
  try {
    if ((req.body.period ?? "monthly") !== "once") {
      const clash = await regularBudgetFor(userId, req.body.category);
      if (clash) return res.status(409).json({ error: true, message: clashMessage(req.body.category, clash.name) });
    }
    await insertBudget(userId, req.body);
    await refreshUserBudgets(userId, req.user.email);
    res.status(201).json({ message: "Budget created successfully" });
  } catch (error) {
    console.log("Error:", error);
    return res.status(500).json({
      error: true,
      message: "An error occurred. Budget was not created",
    });
  }
}

// Change the details of a budget. Its limit changes through updateBudgetLimit.
export async function updateBudget(req, res) {
  const userId = parseInt(req.user.userId);
  const { name, category, subcategories, startDate, endDate, period, rollover, alertMode, warnAt } = req.body;
  try {
    const budget = await ownBudget(userId, req.params.id);
    if (!budget) return res.status(404).json({ error: true, message: "Budget not found." });
    const nextPeriod = period ?? budget.period;
    const once = nextPeriod === "once";
    if (!once) {
      const clash = await regularBudgetFor(userId, category, budget.budget_id);
      if (clash) return res.status(409).json({ error: true, message: clashMessage(category, clash.name) });
    }
    await connection.execute(
      `UPDATE budget SET name = ?, category = ?, subcategories = ?, start_date = ?, end_date = ?, has_time_limit = ?,
        period = ?, rollover = ?, alert_mode = ?, warn_at = ? WHERE budget_id = ?`,
      [
        name.trim(),
        category,
        JSON.stringify(subcategories ?? []),
        once ? (startDate ?? null) : null,
        once ? (endDate ?? null) : null,
        once ? 1 : 0,
        nextPeriod,
        rollover && nextPeriod === "monthly" ? 1 : 0,
        alertMode ?? null,
        warnAt ?? null,
        budget.budget_id,
      ]
    );
    await refreshUserBudgets(userId, req.user.email);
    res.status(200).json({ message: "Budget saved." });
  } catch (error) {
    console.log("Error:", error);
    return res.status(500).json({ error: true, message: "This budget could not be saved." });
  }
}

// Change a budget's limit, for this month alone or from now on.
export async function updateBudgetLimit(req, res) {
  const userId = parseInt(req.user.userId);
  const { amount, scope = "forward" } = req.body;
  try {
    const budget = await ownBudget(userId, req.params.id);
    if (!budget) return res.status(404).json({ error: true, message: "Budget not found." });
    await saveLimit(userId, budget, Number(amount), scope);
    await refreshUserBudgets(userId, req.user.email);
    res.status(200).json({ message: "Budget limit updated." });
  } catch (error) {
    console.log("Error:", error);
    return res.status(500).json({
      error: true,
      message: "An error occurred. The limit was not changed.",
    });
  }
}

// Moves part of one budget's room to another for this month, keeping the total the same.
export async function moveBudgetMoney(req, res) {
  const userId = parseInt(req.user.userId);
  const amount = Number(req.body.amount);
  try {
    const { budgets } = await loadBudgets(userId);
    const from = budgets.find((budget) => budget.budget_id === Number(req.body.fromId));
    const to = budgets.find((budget) => budget.budget_id === Number(req.body.toId));
    if (!from || !to) return res.status(404).json({ error: true, message: "Budget not found." });
    if (from.budget_id === to.budget_id) {
      return res.status(400).json({ error: true, message: "Choose two different budgets." });
    }
    if (amount > from.limit - from.spent || amount > from.baseLimit) {
      return res.status(400).json({ error: true, message: `${from.name} doesn't have that much left to move.` });
    }
    await saveLimit(userId, from, from.baseLimit - amount, "month");
    await saveLimit(userId, to, to.baseLimit + amount, "month");
    await connection.execute(
      "UPDATE budget_changes SET scope = 'move' WHERE user_id = ? AND budget_id IN (?, ?) AND scope = 'month' AND month = ? ORDER BY id DESC LIMIT 2",
      [userId, from.budget_id, to.budget_id, currentMonth()]
    );
    await refreshUserBudgets(userId, req.user.email);
    res.status(200).json({ message: "Money moved." });
  } catch (error) {
    console.log("Error:", error);
    return res.status(500).json({ error: true, message: "This move could not be saved." });
  }
}

export async function getBudgetOverview(req, res) {
  const userId = parseInt(req.user.userId);
  const month = /^\d{4}-\d{2}$/.test(req.query.month ?? "") ? req.query.month : currentMonth();
  try {
    await refreshUserBudgets(userId, req.user.email);
    const overview = await loadBudgets(userId, month);
    const changes = await loadChanges(userId);
    const committed = month === currentMonth() ? await committedByCategory(userId) : {};
    const regular = overview.budgets.filter((budget) => isRegular(budget) && ["active", "exceeded"].includes(budget.status));
    const counts = Object.groupBy(regular, (budget) => budget.category);

    res.status(200).json({
      ...overview,
      budgets: overview.budgets.map((budget) => ({
        ...budget,
        changes: (changes.get(budget.budget_id) ?? []).slice(0, 5),
        committed: isRegular(budget) && budget.period === "monthly" ? Math.round(committed[budget.category] ?? 0) : 0,
      })),
      overlaps: Object.entries(counts)
        .filter(([, list]) => list.length > 1)
        .map(([category, list]) => ({ category, budgets: list.map(({ budget_id, name }) => ({ budget_id, name })) })),
      plan: await buildPlanSummary(userId, overview.budgets),
      review: await buildReview(userId, month === currentMonth() ? shiftMonth(month, -1) : month),
      alertSettings: await loadAlertSettings(userId),
    });
  } catch (error) {
    console.log("Error:", error);
    return res.status(500).json({ error: true, message: "Your budgets could not be loaded." });
  }
}

export async function suggestBudget(req, res) {
  try {
    res.status(200).json({ average: await suggestedLimit(parseInt(req.user.userId), req.query.category ?? "") });
  } catch (error) {
    console.log("Error:", error);
    return res.status(500).json({ error: true, message: "Something went wrong." });
  }
}

export async function getPlan(req, res) {
  try {
    res.status(200).json(await buildPlan(parseInt(req.user.userId)));
  } catch (error) {
    console.log("Error:", error);
    return res.status(500).json({ error: true, message: "Your plan could not be loaded." });
  }
}

// Creates budgets for new categories and updates the rest from this month on.
export async function savePlan(req, res) {
  const userId = parseInt(req.user.userId);
  try {
    const { budgets } = await loadBudgets(userId);
    for (const { category, name, amount } of req.body.rows) {
      const clash = await regularBudgetFor(userId, category);
      if (!clash) {
        await insertBudget(userId, { name: name.trim().toLowerCase(), category, amount });
        continue;
      }
      const budget = budgets.find((row) => row.budget_id === clash.budget_id);
      if (budget.baseLimit !== Number(amount)) await saveLimit(userId, budget, Number(amount), "forward");
    }
    await refreshUserBudgets(userId, req.user.email);
    res.status(200).json({ message: "Your plan is saved." });
  } catch (error) {
    console.log("Error:", error);
    return res.status(500).json({ error: true, message: "Your plan could not be saved." });
  }
}

export async function saveAlertSettings(req, res) {
  const { mode, warnAt, emails } = req.body;
  try {
    await connection.execute("UPDATE users SET budget_alert_mode = ?, budget_warn_at = ?, budget_emails = ? WHERE user_id = ?", [
      mode,
      warnAt,
      emails ? 1 : 0,
      parseInt(req.user.userId),
    ]);
    res.status(200).json({ message: "Alert settings saved." });
  } catch (error) {
    console.log("Error:", error);
    return res.status(500).json({ error: true, message: "Your settings could not be saved." });
  }
}

export async function updateBudgetStatus(req, res) {
  const userId = parseInt(req.user.userId);
  const budgetId = parseInt(req.params.id);
  try {
    if (!req.body.paused) {
      const budget = await ownBudget(userId, budgetId);
      const clash = budget && isRegular(budget) && (await regularBudgetFor(userId, budget.category, budgetId));
      if (clash) return res.status(409).json({ error: true, message: clashMessage(budget.category, clash.name) });
    }
    const [response] = await connection.execute(
      "UPDATE budget SET status = ? WHERE budget_id = ? AND user_id = ?",
      [req.body.paused ? "inactive" : "active", budgetId, userId]
    );
    if (response.affectedRows === 0) {
      return res.status(404).json({ error: true, message: "Budget not found." });
    }
    await refreshUserBudgets(userId, req.user.email);
    res.status(200).json({ message: req.body.paused ? "Budget paused." : "Budget resumed." });
  } catch (error) {
    console.log("Error:", error);
    return res.status(500).json({ error: true, message: "The budget was not changed." });
  }
}

// Delete a budget
export async function deleteBudget(req, res) {
  const userId = parseInt(req.user.userId);
  const { id } = req.params;
  try {
    const [response] = await connection.execute(
      "DELETE FROM budget WHERE budget_id = ? AND user_id = ?",
      [id, userId]
    );
    if (response.affectedRows > 0) {
      await connection.execute(
        "UPDATE expense SET budget_id = NULL, budgeted = 0 WHERE budget_id = ? AND user_id = ?",
        [id, userId]
      );
      for (const table of ["notifications", "budget_limits", "budget_changes", "budget_alerts"]) {
        await connection.execute(`DELETE FROM ${table} WHERE budget_id = ? AND user_id = ?`, [id, userId]);
      }
    }
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
