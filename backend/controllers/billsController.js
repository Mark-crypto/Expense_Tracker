import connection from "../database.js";
import { chooseAccount } from "../utils/accounts.js";
import { keyOf } from "../utils/billMatch.js";
import { refreshUserBudgets } from "../utils/budgetStatus.js";
import {
  addCycle,
  buildCalendar,
  captureDue,
  findSuggestions,
  guessKind,
  loadPriceChanges,
  loadTracked,
  logPriceChange,
  monthlyCost,
  recordRealPayments,
  rollForward,
  today,
  usualMoneyIn,
  weekAhead,
  yearlyCost,
} from "../utils/recurring.js";

const ownBill = async (req, res) => {
  const [[bill]] = await connection.execute(
    `SELECT id, name, category, amount, frequency, due_day, status, account_id,
      DATE_FORMAT(next_due, '%Y-%m-%d') AS next_due
    FROM recurring_payments WHERE id = ? AND user_id = ?`,
    [req.params.id, parseInt(req.user.userId)]
  );
  if (!bill) res.status(404).json({ error: true, message: "This wasn't found." });
  return bill;
};

export const getBills = async (req, res) => {
  const userId = parseInt(req.user.userId);
  try {
    await captureDue(userId);
    const tracked = await loadTracked(userId);
    const active = tracked.filter((bill) => bill.status === "active");
    const suggestions = await findSuggestions(userId, tracked);
    const moneyIn = await usualMoneyIn(userId);
    const priceChanges = await loadPriceChanges(userId);

    const [captures] = await connection.execute(
      `SELECT e.expense_id, e.amount, e.merchant AS name, r.varies, r.id AS recurring_id,
        DATE_FORMAT(e.date_created, '%Y-%m-%d') AS date
      FROM expense e JOIN recurring_payments r ON r.id = e.recurring_id
      WHERE e.user_id = ? AND e.source = 'auto' AND e.status = 'active' AND e.needs_review = 1
      ORDER BY e.date_created DESC`,
      [userId]
    );
    const [[settings]] = await connection.execute("SELECT bill_reminders FROM users WHERE user_id = ?", [userId]);

    const totalFor = (kind, cost) =>
      Math.round(active.filter((bill) => bill.kind === kind).reduce((sum, bill) => sum + cost(bill), 0));
    const bills = totalFor("bill", monthlyCost);
    const subscriptions = totalFor("subscription", monthlyCost);
    res.status(200).json({
      today: today(),
      weekAhead: weekAhead(),
      summary: {
        bills,
        subscriptions,
        subscriptionsYearly: totalFor("subscription", yearlyCost),
        monthly: bills + subscriptions,
        moneyIn,
        next: active[0] ?? null,
      },
      suggestions,
      captures: await Promise.all(
        captures.map(async (row) => {
          const capture = { ...row, amount: Number(row.amount), varies: row.varies === 1 };
          return { ...capture, candidates: await candidatesFor(userId, capture) };
        })
      ),
      active: active.map((bill) => ({
        ...bill,
        yearly: Math.round(yearlyCost(bill)),
        priceChanges: priceChanges.get(bill.id) ?? [],
      })),
      stopped: tracked.filter((bill) => bill.status === "stopped"),
      reminders: settings.bill_reminders === 1,
    });
  } catch (error) {
    console.error("Error in getBills:", error);
    res.status(500).json({ error: true, message: "Your payments could not be loaded." });
  }
};

export const getCalendar = async (req, res) => {
  const userId = parseInt(req.user.userId);
  const month = req.query.month ?? today().slice(0, 7);
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    return res.status(400).json({ error: true, message: "Choose a valid month." });
  }
  try {
    await captureDue(userId);
    res.status(200).json(await buildCalendar(userId, month));
  } catch (error) {
    console.error("Error in getCalendar:", error);
    res.status(500).json({ error: true, message: "Your calendar could not be loaded." });
  }
};

export const createBill = async (req, res) => {
  const userId = parseInt(req.user.userId);
  const { name, category, amount, varies, frequency, nextDue, kind, accountId } = req.body;
  const dueDay = Number(nextDue.slice(8, 10));
  try {
    const [[existing]] = await connection.execute(
      "SELECT id FROM recurring_payments WHERE user_id = ? AND LOWER(name) = LOWER(?)",
      [userId, name.trim()]
    );
    if (existing) {
      return res.status(409).json({ error: true, message: "You're already tracking this. Restart or edit it instead." });
    }
    const [result] = await connection.execute(
      `INSERT INTO recurring_payments (user_id, name, kind, category, amount, varies, frequency, next_due, due_day, account_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, name.trim(), kind ?? guessKind(category), category, amount, varies ? 1 : 0, frequency, rollForward(nextDue, frequency, dueDay), dueDay, await chooseAccount(connection, userId, accountId)]
    );
    res.status(201).json({ id: result.insertId, message: `Now tracking ${name.trim()}.` });
  } catch (error) {
    console.error("Error creating bill:", error);
    res.status(500).json({ error: true, message: "This could not be saved." });
  }
};

export const updateBill = async (req, res) => {
  const { name, category, amount, varies, frequency, nextDue, kind, accountId } = req.body;
  const dueDay = Number(nextDue.slice(8, 10));
  try {
    const bill = await ownBill(req, res);
    if (!bill) return;
    await connection.execute(
      `UPDATE recurring_payments
      SET name = ?, kind = ?, category = ?, amount = ?, varies = ?, frequency = ?, next_due = ?, due_day = ?, reminded_for = NULL, account_id = ?
      WHERE id = ?`,
      [name.trim(), kind ?? guessKind(category), category, amount, varies ? 1 : 0, frequency, rollForward(nextDue, frequency, dueDay), dueDay, await chooseAccount(connection, parseInt(req.user.userId), accountId ?? bill.account_id), bill.id]
    );
    if (!varies && Math.abs(Number(amount) - Number(bill.amount)) >= 1) {
      await logPriceChange(connection, parseInt(req.user.userId), bill.id, bill.amount, amount, today());
    }
    res.status(200).json({ message: "Saved." });
  } catch (error) {
    const taken = error.code === "ER_DUP_ENTRY";
    if (!taken) console.error("Error updating bill:", error);
    res.status(taken ? 409 : 500).json({
      error: true,
      message: taken ? "You already have one with this name." : "This could not be saved.",
    });
  }
};

export const markPaid = async (req, res) => {
  const userId = parseInt(req.user.userId);
  const db = await connection.getConnection();
  try {
    const bill = await ownBill(req, res);
    if (!bill) return;
    const amount = Number(req.body.amount ?? bill.amount);
    const date = today();

    await db.beginTransaction();
    await db.execute(
      `INSERT INTO expense (amount, category, date_created, month, user_id, subcategories, budgeted, merchant, recurring_id, account_id)
      VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
      [
        amount,
        bill.category,
        date,
        new Date(date).toLocaleString("default", { month: "long" }),
        userId,
        JSON.stringify([{ name: bill.name, amount }]),
        bill.name,
        bill.id,
        await chooseAccount(db, userId, bill.account_id),
      ]
    );
    await db.execute("UPDATE recurring_payments SET next_due = ?, reminded_for = NULL WHERE id = ?", [
      addCycle(bill.next_due, bill.frequency, bill.due_day),
      bill.id,
    ]);
    await recordRealPayments(db, userId, [{ name: bill.name, date, amount }], { advance: false });
    await db.commit();

    await refreshUserBudgets(userId, req.user.email);
    res.status(200).json({ message: `${bill.name} marked as paid.` });
  } catch (error) {
    await db.rollback();
    console.error("Error marking bill paid:", error);
    res.status(500).json({ error: true, message: "This payment could not be saved." });
  } finally {
    db.release();
  }
};

export const skipBill = async (req, res) => {
  try {
    const bill = await ownBill(req, res);
    if (!bill) return;
    const next = addCycle(bill.next_due, bill.frequency, bill.due_day);
    await connection.execute("UPDATE recurring_payments SET next_due = ?, reminded_for = NULL WHERE id = ?", [
      next,
      bill.id,
    ]);
    res.status(200).json({ message: `Skipped. Next due ${next}.`, nextDue: next });
  } catch (error) {
    console.error("Error skipping bill:", error);
    res.status(500).json({ error: true, message: "This could not be skipped." });
  }
};

export const stopBill = async (req, res) => {
  try {
    const bill = await ownBill(req, res);
    if (!bill) return;
    await connection.execute(
      `UPDATE recurring_payments SET status = 'stopped', stop_reason = ?, stop_note = ?, stopped_at = ? WHERE id = ?`,
      [req.body.reason ?? null, req.body.note?.trim() || null, today(), bill.id]
    );
    res.status(200).json({ message: `Stopped tracking ${bill.name}.` });
  } catch (error) {
    console.error("Error stopping bill:", error);
    res.status(500).json({ error: true, message: "This could not be stopped." });
  }
};

export const restartBill = async (req, res) => {
  try {
    const bill = await ownBill(req, res);
    if (!bill) return;
    await connection.execute(
      `UPDATE recurring_payments
      SET status = 'active', stop_reason = NULL, stop_note = NULL, stopped_at = NULL, next_due = ?, reminded_for = NULL
      WHERE id = ?`,
      [rollForward(bill.next_due, bill.frequency, bill.due_day), bill.id]
    );
    res.status(200).json({ message: `Tracking ${bill.name} again.` });
  } catch (error) {
    console.error("Error restarting bill:", error);
    res.status(500).json({ error: true, message: "This could not be restarted." });
  }
};

export const confirmCapture = async (req, res) => {
  const userId = parseInt(req.user.userId);
  try {
    const [result] = await connection.execute(
      `UPDATE expense SET needs_review = 0, amount = COALESCE(?, amount),
        subcategories = IF(? IS NULL, subcategories, JSON_ARRAY(JSON_OBJECT('name', merchant, 'amount', ?)))
      WHERE expense_id = ? AND user_id = ? AND source = 'auto' AND status = 'active'`,
      [req.body.amount ?? null, req.body.amount ?? null, req.body.amount ?? null, req.params.expenseId, userId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: true, message: "This payment wasn't found." });
    }
    await refreshUserBudgets(userId, req.user.email);
    res.status(200).json({ message: "Payment confirmed." });
  } catch (error) {
    console.error("Error confirming capture:", error);
    res.status(500).json({ error: true, message: "This payment could not be confirmed." });
  }
};

const CANDIDATE_DAYS = 10;

// Real payments near a bill's due date that might be it under another name, closest amount first.
const candidatesFor = async (userId, capture) => {
  const [rows] = await connection.execute(
    `SELECT expense_id AS id, merchant AS name, amount, DATE_FORMAT(date_created, '%Y-%m-%d') AS date
    FROM expense
    WHERE user_id = ? AND merchant IS NOT NULL AND status = 'active' AND source <> 'auto'
      AND ABS(DATEDIFF(date_created, ?)) <= ?`,
    [userId, capture.date, CANDIDATE_DAYS]
  );
  return rows
    .map((row) => ({ ...row, amount: Number(row.amount) }))
    .sort((a, b) => Math.abs(a.amount - capture.amount) - Math.abs(b.amount - capture.amount))
    .slice(0, 4);
};

// "I paid this as KPLC PREPAID": the bill counts as paid, and that name is remembered for it.
export const linkCapture = async (req, res) => {
  const userId = parseInt(req.user.userId);
  const db = await connection.getConnection();
  try {
    const [[capture]] = await db.execute(
      `SELECT e.expense_id, e.recurring_id, r.name AS bill
      FROM expense e JOIN recurring_payments r ON r.id = e.recurring_id
      WHERE e.expense_id = ? AND e.user_id = ? AND e.source = 'auto' AND e.status = 'active'`,
      [req.params.expenseId, userId]
    );
    const [[payment]] = await db.execute(
      `SELECT merchant, amount, DATE_FORMAT(date_created, '%Y-%m-%d') AS date FROM expense
      WHERE expense_id = ? AND user_id = ? AND status = 'active' AND source <> 'auto' AND merchant IS NOT NULL`,
      [req.body.paymentId, userId]
    );
    if (!capture || !payment) return res.status(404).json({ error: true, message: "This wasn't found." });

    await db.beginTransaction();
    await db.execute("INSERT IGNORE INTO bill_aliases (recurring_id, user_id, alias) VALUES (?, ?, ?)", [
      capture.recurring_id,
      userId,
      keyOf(payment.merchant),
    ]);
    await db.execute("UPDATE expense SET status = 'inactive' WHERE expense_id = ?", [capture.expense_id]);
    await recordRealPayments(db, userId, [{ name: payment.merchant, date: payment.date, amount: Number(payment.amount) }], {
      advance: false,
    });
    await db.commit();

    await refreshUserBudgets(userId, req.user.email);
    res.status(200).json({ message: `${capture.bill} marked as paid. Payments to ${payment.merchant} will count as ${capture.bill} from now on.` });
  } catch (error) {
    await db.rollback();
    console.error("Error linking bill payment:", error);
    res.status(500).json({ error: true, message: "This could not be saved." });
  } finally {
    db.release();
  }
};

export const rejectCapture = async (req, res) => {
  const userId = parseInt(req.user.userId);
  try {
    const [result] = await connection.execute(
      "UPDATE expense SET status = 'inactive' WHERE expense_id = ? AND user_id = ? AND source = 'auto'",
      [req.params.expenseId, userId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: true, message: "This payment wasn't found." });
    }
    await refreshUserBudgets(userId, req.user.email);
    res.status(200).json({ message: "Removed from your expenses." });
  } catch (error) {
    console.error("Error rejecting capture:", error);
    res.status(500).json({ error: true, message: "This payment could not be removed." });
  }
};

export const setReminders = async (req, res) => {
  try {
    await connection.execute("UPDATE users SET bill_reminders = ? WHERE user_id = ?", [
      req.body.enabled ? 1 : 0,
      parseInt(req.user.userId),
    ]);
    res.status(200).json({ message: req.body.enabled ? "Email reminders on." : "Email reminders off." });
  } catch (error) {
    console.error("Error saving reminders:", error);
    res.status(500).json({ error: true, message: "This setting could not be saved." });
  }
};
