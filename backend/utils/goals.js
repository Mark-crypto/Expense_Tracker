import connection from "../database.js";
import { addDays, daysBetween, today } from "./dates.js";

const BEHIND_NOTE_DAYS = 14;
const roundUp = (amount) => Math.ceil(amount / 10) * 10;

const describe = (row, saved, account, now) => {
  const target = Number(row.target);
  const start = Number(row.start_amount);
  const remaining = Math.max(target - saved, 0);
  const goal = {
    id: row.id,
    name: row.name,
    target,
    saved: Math.round(saved),
    remaining: Math.round(remaining),
    dueDate: row.due_date,
    accountId: account?.id ?? null,
    accountName: account?.name ?? null,
    // Money sitting in spendable accounts has to be kept out of Safe to spend.
    held: !account || account.spendable,
    behindNotedOn: row.behind_noted_on,
    daysLeft: null,
    weekly: null,
    monthly: null,
    state: remaining === 0 ? "reached" : "open",
  };
  if (!row.due_date || remaining === 0) return goal;

  const daysLeft = daysBetween(now, row.due_date);
  goal.daysLeft = daysLeft;
  if (daysLeft <= 0) return { ...goal, state: "late" };

  goal.weekly = roundUp((remaining / daysLeft) * 7);
  goal.monthly = roundUp((remaining / daysLeft) * 30);

  // The plan runs in a straight line from where it started to the target on the date.
  const total = Math.max(daysBetween(row.started_on, row.due_date), 1);
  const elapsed = Math.min(Math.max(daysBetween(row.started_on, now), 0), total);
  const expected = start + ((target - start) * elapsed) / total;
  const planWeekly = ((target - start) / total) * 7;
  goal.expected = Math.round(expected);
  goal.state = saved < expected - planWeekly / 2 ? "behind" : "on_track";
  return goal;
};

// A shared account fills its goals in date order, the nearest first.
export const loadGoals = async (userId, accounts) => {
  const [rows] = await connection.execute(
    `SELECT g.id, g.name, g.target, g.start_amount, g.account_id,
      DATE_FORMAT(g.due_date, '%Y-%m-%d') AS due_date,
      DATE_FORMAT(g.started_on, '%Y-%m-%d') AS started_on,
      DATE_FORMAT(g.behind_noted_on, '%Y-%m-%d') AS behind_noted_on,
      COALESCE((SELECT SUM(m.amount) FROM goal_moves m WHERE m.goal_id = g.id), 0) AS moved
    FROM savings_goals g
    WHERE g.user_id = ? AND g.status = 'active'
    ORDER BY g.due_date IS NULL, g.due_date, g.id`,
    [userId]
  );
  const byId = new Map(accounts.map((account) => [account.id, account]));
  const left = new Map(accounts.map((account) => [account.id, Math.max(account.balance, 0)]));
  const now = today();

  return rows.map((row) => {
    const account = byId.get(row.account_id) ?? null;
    let saved = Math.max(Number(row.moved), 0);
    if (account) {
      saved = Math.min(left.get(account.id), Number(row.target));
      left.set(account.id, left.get(account.id) - saved);
    }
    return describe(row, saved, account, now);
  });
};

// What Safe to spend keeps back: money already set aside in spendable accounts,
// plus what the dated goals still need before the horizon.
export const goalHold = (goals, until) => {
  const horizon = Math.max(daysBetween(today(), until), 0);
  return goals
    .filter((goal) => goal.held)
    .reduce((sum, goal) => {
      const upcoming = goal.daysLeft > 0 ? (goal.remaining * Math.min(horizon, goal.daysLeft)) / goal.daysLeft : 0;
      return sum + goal.saved + upcoming;
    }, 0);
};

// A quiet in-app note when a goal slips, at most once every two weeks.
export const noteBehindGoals = async (userId, goals) => {
  const now = today();
  for (const goal of goals) {
    if (goal.state !== "behind") continue;
    if (goal.behindNotedOn && goal.behindNotedOn > addDays(now, -BEHIND_NOTE_DAYS)) continue;
    await connection.execute("UPDATE savings_goals SET behind_noted_on = ? WHERE id = ?", [now, goal.id]);
    await connection.execute("INSERT INTO notifications (user_id, type, message) VALUES (?, 'goal', ?)", [
      userId,
      `${goal.name} is behind. Put aside KES ${goal.weekly.toLocaleString("en-KE")} a week to still make it.`,
    ]);
  }
};

export const publicGoal = ({ behindNotedOn, held, expected, ...goal }) => ({ ...goal, keptBack: held });
