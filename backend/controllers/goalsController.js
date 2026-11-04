import connection from "../database.js";
import { loadAccounts } from "../utils/accounts.js";
import { today } from "../utils/dates.js";
import { loadGoals, noteBehindGoals, publicGoal } from "../utils/goals.js";

const fail = (res, message, error) => {
  console.error(message, error);
  res.status(500).json({ error: true, message });
};

const userIdOf = (req) => parseInt(req.user.userId);

const ownGoal = async (userId, id) => {
  const [[goal]] = await connection.execute(
    "SELECT id, name, account_id FROM savings_goals WHERE id = ? AND user_id = ? AND status = 'active'",
    [id, userId]
  );
  return goal ?? null;
};

const ownAccountId = async (userId, id) => {
  if (!id) return null;
  const [[account]] = await connection.execute(
    "SELECT id FROM accounts WHERE id = ? AND user_id = ? AND status = 'active'",
    [id, userId]
  );
  return account ? account.id : undefined;
};

const goalsFor = async (userId) => loadGoals(userId, (await loadAccounts(userId)).accounts);

// The plan restarts from what's saved now, so a change is never "behind" on day one.
const restartPlan = async (userId, goalId) => {
  const goal = (await goalsFor(userId)).find((row) => row.id === goalId);
  await connection.execute("UPDATE savings_goals SET start_amount = ?, started_on = ? WHERE id = ?", [
    goal?.saved ?? 0,
    today(),
    goalId,
  ]);
};

export const getGoals = async (req, res) => {
  const userId = userIdOf(req);
  try {
    const { accounts } = await loadAccounts(userId);
    const goals = await loadGoals(userId, accounts);
    await noteBehindGoals(userId, goals);
    res.status(200).json({
      goals: goals.map(publicGoal),
      accounts: accounts.map(({ id, name, type, spendable, balance }) => ({ id, name, type, spendable, balance })),
    });
  } catch (error) {
    fail(res, "Your goals could not be loaded.", error);
  }
};

export const createGoal = async (req, res) => {
  const userId = userIdOf(req);
  const { name, target, dueDate, accountId, saved } = req.body;
  try {
    const account = await ownAccountId(userId, accountId);
    if (account === undefined) return res.status(404).json({ error: true, message: "This account wasn't found." });
    const [result] = await connection.execute(
      "INSERT INTO savings_goals (user_id, name, target, due_date, account_id, started_on) VALUES (?, ?, ?, ?, ?, ?)",
      [userId, name.trim(), target, dueDate || null, account, today()]
    );
    if (!account && saved > 0) {
      await connection.execute("INSERT INTO goal_moves (goal_id, user_id, amount, moved_on) VALUES (?, ?, ?, ?)", [
        result.insertId,
        userId,
        saved,
        today(),
      ]);
    }
    await restartPlan(userId, result.insertId);
    res.status(201).json({ id: result.insertId, message: `${name.trim()} added.` });
  } catch (error) {
    fail(res, "This goal could not be added.", error);
  }
};

export const updateGoal = async (req, res) => {
  const userId = userIdOf(req);
  const { name, target, dueDate, accountId } = req.body;
  try {
    const goal = await ownGoal(userId, req.params.id);
    if (!goal) return res.status(404).json({ error: true, message: "This goal wasn't found." });
    const account = await ownAccountId(userId, accountId);
    if (account === undefined) return res.status(404).json({ error: true, message: "This account wasn't found." });
    await connection.execute("UPDATE savings_goals SET name = ?, target = ?, due_date = ?, account_id = ? WHERE id = ?", [
      name.trim(),
      target,
      dueDate || null,
      account,
      goal.id,
    ]);
    await restartPlan(userId, goal.id);
    res.status(200).json({ message: "Saved." });
  } catch (error) {
    fail(res, "This goal could not be saved.", error);
  }
};

// Only for goals without an account; those with one move money between accounts.
export const moveGoalMoney = async (req, res) => {
  const userId = userIdOf(req);
  const { amount, direction } = req.body;
  try {
    const goal = await ownGoal(userId, req.params.id);
    if (!goal) return res.status(404).json({ error: true, message: "This goal wasn't found." });
    if (goal.account_id) {
      return res.status(400).json({ error: true, message: "This goal is kept in an account. Record a move instead." });
    }
    const current = (await goalsFor(userId)).find((row) => row.id === goal.id);
    if (direction === "take" && amount > current.saved) {
      return res.status(400).json({ error: true, message: `Only ${current.saved.toLocaleString("en-KE")} is set aside.` });
    }
    await connection.execute("INSERT INTO goal_moves (goal_id, user_id, amount, moved_on) VALUES (?, ?, ?, ?)", [
      goal.id,
      userId,
      direction === "take" ? -amount : amount,
      today(),
    ]);
    res.status(201).json({ message: direction === "take" ? "Taken out." : `Added to ${goal.name}.` });
  } catch (error) {
    fail(res, "This could not be saved.", error);
  }
};

export const archiveGoal = async (req, res) => {
  const userId = userIdOf(req);
  try {
    const goal = await ownGoal(userId, req.params.id);
    if (!goal) return res.status(404).json({ error: true, message: "This goal wasn't found." });
    await connection.execute("UPDATE savings_goals SET status = 'archived' WHERE id = ?", [goal.id]);
    res.status(200).json({ message: `${goal.name} archived.` });
  } catch (error) {
    fail(res, "This goal could not be archived.", error);
  }
};

export const deleteGoal = async (req, res) => {
  const userId = userIdOf(req);
  try {
    const goal = await ownGoal(userId, req.params.id);
    if (!goal) return res.status(404).json({ error: true, message: "This goal wasn't found." });
    await connection.execute("DELETE FROM goal_moves WHERE goal_id = ?", [goal.id]);
    await connection.execute("DELETE FROM savings_goals WHERE id = ?", [goal.id]);
    res.status(200).json({ message: `${goal.name} deleted.` });
  } catch (error) {
    fail(res, "This goal could not be deleted.", error);
  }
};
