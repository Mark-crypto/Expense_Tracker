import connection from "../database.js";
import {
  accountOfType,
  buildReport,
  latestStatement,
  loadAccounts,
  recentActivity,
  recordBalance,
  reportMonths,
  syncStatementBalances,
  transferQuestions,
} from "../utils/accounts.js";
import { refreshUserBudgets } from "../utils/budgetStatus.js";
import { addDays, today } from "../utils/dates.js";
import { loadGoals } from "../utils/goals.js";
import { captureDue } from "../utils/recurring.js";
import { loadPaySettings } from "../utils/safeToSpend.js";

const fail = (res, message, error) => {
  console.error(message, error);
  res.status(500).json({ error: true, message });
};

const userIdOf = (req) => parseInt(req.user.userId);

const ownAccount = async (userId, id) => {
  const [[account]] = await connection.execute(
    "SELECT id, name, type FROM accounts WHERE id = ? AND user_id = ? AND status = 'active'",
    [id, userId]
  );
  return account ?? null;
};

export const getAccounts = async (req, res) => {
  const userId = userIdOf(req);
  try {
    await captureDue(userId);
    const data = await loadAccounts(userId);
    const months = reportMonths(data.accounts);
    const lastMonth = addDays(`${today().slice(0, 7)}-01`, -1).slice(0, 7);
    const wanted = months.includes(req.query.month) ? req.query.month : months.includes(lastMonth) ? lastMonth : months[0];

    res.status(200).json({
      accounts: data.accounts.map(({ anchors, ...account }) => account),
      total: data.accounts.reduce((sum, account) => sum + account.balance, 0),
      statement: await latestStatement(userId),
      questions: await transferQuestions(userId, data.accounts),
      activity: await recentActivity(userId),
      months,
      report: wanted ? await buildReport(userId, data, wanted) : null,
      today: today(),
    });
  } catch (error) {
    fail(res, "Your accounts could not be loaded.", error);
  }
};

export const createAccount = async (req, res) => {
  const userId = userIdOf(req);
  const { name, type, balance, spendable } = req.body;
  try {
    if (type === "mpesa" && (await accountOfType(connection, userId, "mpesa"))) {
      return res.status(409).json({ error: true, message: "You already have an M-Pesa account." });
    }
    const [result] = await connection.execute(
      "INSERT INTO accounts (user_id, name, type, spendable) VALUES (?, ?, ?, ?)",
      [userId, name.trim(), type, spendable === false ? 0 : 1]
    );
    const id = result.insertId;
    if (type === "mpesa") {
      await syncStatementBalances(connection, userId, id);
      await connection.execute(
        "UPDATE expense SET account_id = ? WHERE user_id = ? AND source = 'mpesa' AND account_id IS NULL",
        [id, userId]
      );
    }
    await recordBalance(connection, userId, id, balance, today(), "manual");
    res.status(201).json({ id, message: `${name.trim()} added.` });
  } catch (error) {
    fail(res, "This account could not be added.", error);
  }
};

export const updateAccount = async (req, res) => {
  const userId = userIdOf(req);
  try {
    const account = await ownAccount(userId, req.params.id);
    if (!account) return res.status(404).json({ error: true, message: "This account wasn't found." });
    await connection.execute("UPDATE accounts SET name = ?, spendable = ? WHERE id = ?", [
      req.body.name.trim(),
      req.body.spendable ? 1 : 0,
      account.id,
    ]);
    res.status(200).json({ message: "Saved." });
  } catch (error) {
    fail(res, "This account could not be saved.", error);
  }
};

// Past expenses keep their account; only the balance stops being tracked.
export const removeAccount = async (req, res) => {
  const userId = userIdOf(req);
  try {
    const account = await ownAccount(userId, req.params.id);
    if (!account) return res.status(404).json({ error: true, message: "This account wasn't found." });
    // Goals kept here hold on to what they had saved.
    const goals = await loadGoals(userId, (await loadAccounts(userId)).accounts);
    for (const goal of goals.filter((row) => row.accountId === account.id)) {
      await connection.execute("INSERT INTO goal_moves (goal_id, user_id, amount, moved_on) VALUES (?, ?, ?, ?)", [
        goal.id,
        userId,
        goal.saved,
        today(),
      ]);
      await connection.execute("UPDATE savings_goals SET account_id = NULL WHERE id = ?", [goal.id]);
    }
    await connection.execute("UPDATE accounts SET status = 'archived' WHERE id = ?", [account.id]);
    await connection.execute("UPDATE recurring_payments SET account_id = NULL WHERE account_id = ?", [account.id]);
    res.status(200).json({ message: `${account.name} removed.` });
  } catch (error) {
    fail(res, "This account could not be removed.", error);
  }
};

export const updateBalance = async (req, res) => {
  const userId = userIdOf(req);
  try {
    const account = await ownAccount(userId, req.params.id);
    if (!account) return res.status(404).json({ error: true, message: "This account wasn't found." });
    await recordBalance(connection, userId, account.id, req.body.balance, today(), "manual");
    res.status(200).json({ message: `${account.name} updated.` });
  } catch (error) {
    fail(res, "This balance could not be saved.", error);
  }
};

export const addIncome = async (req, res) => {
  const userId = userIdOf(req);
  const { accountId, amount, name, date } = req.body;
  try {
    if (!(await ownAccount(userId, accountId))) {
      return res.status(404).json({ error: true, message: "This account wasn't found." });
    }
    await connection.execute(
      "INSERT INTO account_income (user_id, account_id, amount, name, received_on) VALUES (?, ?, ?, ?, ?)",
      [userId, accountId, amount, name.trim(), date]
    );
    res.status(201).json({ message: "Money in recorded." });
  } catch (error) {
    fail(res, "This could not be saved.", error);
  }
};

export const deleteIncome = async (req, res) => {
  try {
    await connection.execute("DELETE FROM account_income WHERE id = ? AND user_id = ?", [req.params.id, userIdOf(req)]);
    res.status(200).json({ message: "Removed." });
  } catch (error) {
    fail(res, "This could not be removed.", error);
  }
};

export const addTransfer = async (req, res) => {
  const userId = userIdOf(req);
  const { fromId, toId, amount, date } = req.body;
  try {
    if (Number(fromId) === Number(toId)) {
      return res.status(400).json({ error: true, message: "Choose two different accounts." });
    }
    if (!(await ownAccount(userId, fromId)) || !(await ownAccount(userId, toId))) {
      return res.status(404).json({ error: true, message: "This account wasn't found." });
    }
    await connection.execute(
      "INSERT INTO account_transfers (user_id, from_account_id, to_account_id, amount, moved_on) VALUES (?, ?, ?, ?, ?)",
      [userId, fromId, toId, amount, date]
    );
    res.status(201).json({ message: "Move recorded." });
  } catch (error) {
    fail(res, "This move could not be saved.", error);
  }
};

export const deleteTransfer = async (req, res) => {
  try {
    await connection.execute("DELETE FROM account_transfers WHERE id = ? AND user_id = ?", [req.params.id, userIdOf(req)]);
    res.status(200).json({ message: "Removed." });
  } catch (error) {
    fail(res, "This could not be removed.", error);
  }
};

// Answering "transfer" stops the row counting as spending in both directions.
export const answerQuestion = async (req, res) => {
  const userId = userIdOf(req);
  const { accountId } = req.body;
  const db = await connection.getConnection();
  try {
    const [[row]] = await db.execute(
      `SELECT id, receipt_no, paid_in, withdrawn, DATE_FORMAT(occurred_at, '%Y-%m-%d') AS date
      FROM mpesa_transactions WHERE id = ? AND user_id = ?`,
      [req.params.id, userId]
    );
    if (!row) return res.status(404).json({ error: true, message: "This wasn't found." });

    await db.beginTransaction();
    if (accountId) {
      const mpesaId = await accountOfType(db, userId, "mpesa");
      const target = await ownAccount(userId, accountId);
      if (!mpesaId || !target) {
        await db.rollback();
        return res.status(404).json({ error: true, message: "This account wasn't found." });
      }
      const incoming = Number(row.paid_in) > 0;
      await db.execute(
        `INSERT IGNORE INTO account_transfers (user_id, from_account_id, to_account_id, amount, moved_on, receipt_no)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
          userId,
          incoming ? target.id : mpesaId,
          incoming ? mpesaId : target.id,
          incoming ? row.paid_in : row.withdrawn,
          row.date,
          row.receipt_no,
        ]
      );
      await db.execute("UPDATE expense SET status = 'inactive' WHERE user_id = ? AND receipt_no = ?", [userId, row.receipt_no]);
    }
    await db.execute("UPDATE mpesa_transactions SET transfer_status = ? WHERE id = ?", [
      accountId ? "transfer" : "payment",
      row.id,
    ]);
    await db.commit();

    await refreshUserBudgets(userId, req.user.email);
    res.status(200).json({ message: accountId ? "Marked as a transfer." : "Kept as a payment." });
  } catch (error) {
    await db.rollback();
    fail(res, "This could not be saved.", error);
  } finally {
    db.release();
  }
};

export const getPaySettings = async (req, res) => {
  try {
    res.status(200).json(await loadPaySettings(userIdOf(req)));
  } catch (error) {
    fail(res, "Your settings could not be loaded.", error);
  }
};

export const savePaySettings = async (req, res) => {
  const { payType, payDay, buffer } = req.body;
  try {
    await connection.execute("UPDATE users SET pay_type = ?, pay_day = ?, safety_buffer = ?, pay_set = 1 WHERE user_id = ?", [
      payType,
      payType === "salary" ? payDay : null,
      buffer,
      userIdOf(req),
    ]);
    res.status(200).json({ message: "Saved." });
  } catch (error) {
    fail(res, "Your settings could not be saved.", error);
  }
};
