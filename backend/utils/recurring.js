import connection from "../database.js";
import { chooseAccount } from "./accounts.js";
import { billFor, keyOf, matchesBill, sameName } from "./billMatch.js";
import { refreshUserBudgets } from "./budgetStatus.js";
import { addDays, daysBetween, today } from "./dates.js";
import { sendReminderEmail } from "./emailAlert.js";

const HISTORY_MONTHS = 26;
const MAX_CATCH_UP = 24;
const REMINDER_DAYS = 3;
const MISSED_AFTER_DAYS = 5;
const PRICE_ALERT_DAYS = 45;
const VARIES_SHARE = 0.05;
const RECENT_PAYMENTS = 3;
const INCOME_MONTHS = 3;

const SUBSCRIPTION_CATEGORIES = ["entertainment", "technology"];
export const guessKind = (category) => (SUBSCRIPTION_CATEGORIES.includes(category) ? "subscription" : "bill");

const MONTHS_IN_CYCLE = { monthly: 1, termly: 4, yearly: 12 };
const PER_YEAR = { weekly: 52, monthly: 12, termly: 3, yearly: 1 };

// Gap between payments, in days, that makes each cycle believable.
const CYCLES = [
  { frequency: "weekly", low: 6, high: 8, payments: 4, stale: 21 },
  { frequency: "monthly", low: 26, high: 35, payments: 3, stale: 45 },
  { frequency: "termly", low: 100, high: 135, payments: 3, stale: 150 },
  { frequency: "yearly", low: 350, high: 380, payments: 2, stale: 400 },
];

const pad = (value) => String(value).padStart(2, "0");
const round = (value) => Math.round(value);
export { today };

// Other names each bill is paid under, as sets of lower-case names by bill id.
export const loadAliases = async (db, userId) => {
  const [rows] = await db.execute("SELECT recurring_id, alias FROM bill_aliases WHERE user_id = ?", [userId]);
  const byBill = new Map();
  for (const { recurring_id: id, alias } of rows) byBill.set(id, (byBill.get(id) ?? new Set()).add(alias));
  return byBill;
};

const longDate = (date) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString("en-KE", { day: "numeric", month: "short", timeZone: "UTC" });
const money = (value) => `KES ${round(value).toLocaleString("en-KE")}`;

// Keeps the chosen day, so the 31st falls back in February and returns in March.
export const addCycle = (date, frequency, dueDay) => {
  if (frequency === "weekly") return addDays(date, 7);
  const [year, month] = date.split("-").map(Number);
  const target = new Date(Date.UTC(year, month - 1 + MONTHS_IN_CYCLE[frequency], 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  return `${target.getUTCFullYear()}-${pad(target.getUTCMonth() + 1)}-${pad(Math.min(dueDay, lastDay))}`;
};

export const rollForward = (date, frequency, dueDay) => {
  let next = date;
  while (next < today()) next = addCycle(next, frequency, dueDay);
  return next;
};

const matchWindow = (frequency) => (frequency === "weekly" ? 2 : 7);
export const monthlyCost = ({ amount, frequency }) => (Number(amount) * PER_YEAR[frequency]) / 12;
export const yearlyCost = ({ amount, frequency }) => Number(amount) * PER_YEAR[frequency];

export const nameOf = (row) => {
  if (row.merchant) return row.merchant;
  try {
    const items = JSON.parse(row.subcategories) ?? [];
    if (items[0]?.name) return items[0].name;
  } catch {
    // Older rows may hold plain text.
  }
  return row.description || row.category;
};

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
};

const BILL_COLUMNS = `id, user_id, name, kind, category, amount, varies, frequency, due_day, status, account_id,
  stop_reason, stop_note,
  DATE_FORMAT(next_due, '%Y-%m-%d') AS next_due,
  DATE_FORMAT(stopped_at, '%Y-%m-%d') AS stopped_at,
  DATE_FORMAT(last_paid, '%Y-%m-%d') AS last_paid,
  DATE_FORMAT(reminded_for, '%Y-%m-%d') AS reminded_for,
  DATE_FORMAT(missed_for, '%Y-%m-%d') AS missed_for`;

export const loadTracked = async (userId) => {
  const [rows] = await connection.execute(
    `SELECT ${BILL_COLUMNS} FROM recurring_payments WHERE user_id = ? ORDER BY next_due, name`,
    [userId]
  );
  return rows.map((row) => ({ ...row, amount: Number(row.amount), varies: row.varies === 1 }));
};

// Finds repeat payments in history and works out how often they come round.
export const detectRecurring = (rows, skip, now = today()) =>
  [...groupPayments(rows).values()].flatMap((group) => {
    if (skip.has(group.key) || group.key === "m-pesa") return [];
    const payments = [...group.days.entries()].sort(([a], [b]) => a.localeCompare(b));
    const dates = payments.map(([date]) => date);
    const gaps = dates.slice(1).map((date, index) => daysBetween(dates[index], date));
    const typical = median(gaps);
    const cycle = CYCLES.find(({ low, high }) => typical >= low && typical <= high);
    if (!cycle || payments.length < cycle.payments) return [];

    const steady = gaps.filter((gap) => gap >= cycle.low - 5 && gap <= cycle.high + 5).length;
    if (steady / gaps.length < 0.75 || daysBetween(dates.at(-1), now) > cycle.stale) return [];

    const recent = payments.slice(-RECENT_PAYMENTS).map(([, amount]) => amount);
    const amount = median(recent);
    const dueDay = median(dates.map((date) => Number(date.slice(8))));
    const lastDue = cycle.frequency === "weekly" ? dates.at(-1) : `${dates.at(-1).slice(0, 8)}${pad(Math.min(dueDay, 28))}`;
    return {
      key: group.key,
      name: group.name,
      kind: guessKind(group.category),
      category: group.category,
      amount: round(amount),
      varies: Math.max(...recent) - Math.min(...recent) > amount * VARIES_SHARE,
      frequency: cycle.frequency,
      day: dueDay,
      payments: payments.length,
      nextDue: rollForward(addCycle(lastDue, cycle.frequency, dueDay), cycle.frequency, dueDay),
    };
  });

const groupPayments = (rows) => {
  const groups = new Map();
  rows.forEach((row) => {
    const name = nameOf(row);
    const key = keyOf(name);
    const group = groups.get(key) ?? { key, name, category: row.category, days: new Map() };
    group.category = row.category;
    group.days.set(row.date, (group.days.get(row.date) ?? 0) + row.amount);
    groups.set(key, group);
  });
  return groups;
};

export const findSuggestions = async (userId, tracked) => {
  const [raw] = await connection.execute(
    `SELECT amount, category, merchant, description, subcategories,
      DATE_FORMAT(date_created, '%Y-%m-%d') AS date
    FROM expense
    WHERE user_id = ? AND status = 'active' AND source <> 'auto'
      AND date_created >= CURDATE() - INTERVAL ${HISTORY_MONTHS} MONTH
    ORDER BY date_created`,
    [userId]
  );
  const [dismissed] = await connection.execute("SELECT bill_key FROM dismissed_bills WHERE user_id = ?", [userId]);
  const skip = new Set([...dismissed.map((row) => row.bill_key), ...tracked.map((bill) => keyOf(bill.name))]);
  const rows = raw.map((row) => ({ ...row, amount: Number(row.amount) })).filter((row) => row.date <= today());
  // Not suggested again when it's already tracked under a slightly different name.
  const aliases = await loadAliases(connection, userId);
  const known = tracked.map((bill) => ({ ...bill, aliases: aliases.get(bill.id) }));
  return detectRecurring(rows, skip)
    .filter((found) => !known.some((bill) => sameName(bill.name, found.name) || bill.aliases?.has(keyOf(found.name))))
    .sort((a, b) => b.amount - a.amount);
};

const insertCapture = async (db, bill, date) => {
  const receipt = `R${bill.id}-${date.replaceAll("-", "")}`;
  await db.execute(
    `INSERT IGNORE INTO expense
    (amount, category, date_created, month, user_id, subcategories, budgeted, merchant, description, receipt_no, source, needs_review, recurring_id, account_id)
    VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, 'auto', 1, ?, ?)`,
    [
      bill.amount,
      bill.category,
      date,
      new Date(date).toLocaleString("default", { month: "long" }),
      bill.user_id,
      JSON.stringify([{ name: bill.name, amount: Number(bill.amount) }]),
      bill.name,
      bill.varies ? "Estimated from your usual amount" : "Added automatically",
      receipt,
      bill.id,
      bill.account_id,
    ]
  );
};

// The next_due check stops two runs capturing the same date, and the receipt
// key stops a repeat if one ever gets past it.
const captureBill = async (bill) => {
  const window = matchWindow(bill.frequency);
  let due = bill.next_due;
  let captured = 0;

  for (let step = 0; step < MAX_CATCH_UP && due <= today(); step += 1) {
    const next = addCycle(due, bill.frequency, bill.due_day);
    const db = await connection.getConnection();
    try {
      await db.beginTransaction();
      const [moved] = await db.execute(
        "UPDATE recurring_payments SET next_due = ?, reminded_for = NULL WHERE id = ? AND next_due = ?",
        [next, bill.id, due]
      );
      if (moved.affectedRows === 0) {
        await db.rollback();
        return captured;
      }
      const [nearby] = await db.execute(
        `SELECT merchant, amount FROM expense
        WHERE user_id = ? AND merchant IS NOT NULL AND status = 'active' AND source <> 'auto'
          AND ABS(DATEDIFF(date_created, ?)) <= ?`,
        [bill.user_id, due, window]
      );
      const paid = nearby.some((row) => matchesBill(bill, row.merchant, Number(row.amount)));
      if (!paid) {
        await insertCapture(db, bill, due);
        captured += 1;
      }
      await db.commit();
    } catch (error) {
      await db.rollback();
      throw error;
    } finally {
      db.release();
    }
    due = next;
  }
  return captured;
};

export const captureDue = async (userId) => {
  const [bills] = await connection.execute(
    `SELECT r.id, r.user_id, r.name, r.category, r.amount, r.varies, r.frequency, r.due_day, r.account_id,
      DATE_FORMAT(r.next_due, '%Y-%m-%d') AS next_due, u.email
    FROM recurring_payments r JOIN users u ON u.user_id = r.user_id
    WHERE r.user_id = ? AND r.status = 'active' AND r.next_due <= ?`,
    [userId, today()]
  );
  const aliases = await loadAliases(connection, userId);
  let captured = 0;
  for (const bill of bills) {
    bill.aliases = aliases.get(bill.id);
    bill.varies = bill.varies === 1;
    bill.account_id = await chooseAccount(connection, userId, bill.account_id);
    captured += await captureBill(bill);
  }
  if (captured > 0) await refreshUserBudgets(userId, bills[0].email);
  return captured;
};

const notify = (db, userId, message) =>
  db.execute("INSERT INTO notifications (user_id, type, message) VALUES (?, 'bill', ?)", [userId, message]);

export const logPriceChange = (db, userId, recurringId, oldAmount, newAmount, date) =>
  db.execute(
    "INSERT INTO recurring_price_changes (user_id, recurring_id, old_amount, new_amount, changed_on) VALUES (?, ?, ?, ?, ?)",
    [userId, recurringId, oldAmount, newAmount, date]
  );

export const loadPriceChanges = async (userId) => {
  const [rows] = await connection.execute(
    `SELECT recurring_id, old_amount, new_amount, DATE_FORMAT(changed_on, '%Y-%m-%d') AS date
    FROM recurring_price_changes WHERE user_id = ? ORDER BY changed_on DESC, id DESC`,
    [userId]
  );
  const byBill = new Map();
  for (const row of rows) {
    const list = byBill.get(row.recurring_id) ?? [];
    list.push({ date: row.date, from: Number(row.old_amount), to: Number(row.new_amount) });
    byBill.set(row.recurring_id, list);
  }
  return byBill;
};

// A real payment replaces any automatic one near it, and shows up price changes.
export const recordRealPayments = async (db, userId, payments, { advance = true } = {}) => {
  const [rows] = await db.execute(
    `SELECT id, name, amount, varies, frequency, due_day,
      DATE_FORMAT(next_due, '%Y-%m-%d') AS next_due,
      DATE_FORMAT(last_paid, '%Y-%m-%d') AS last_paid
    FROM recurring_payments WHERE user_id = ? AND status = 'active'`,
    [userId]
  );
  if (rows.length === 0) return;
  const aliases = await loadAliases(db, userId);
  const bills = rows.map((row) => ({ ...row, amount: Number(row.amount), aliases: aliases.get(row.id) }));

  for (const { name, date, amount } of [...payments].sort((a, b) => a.date.localeCompare(b.date))) {
    const bill = name && billFor(bills, name, amount);
    if (!bill) continue;
    const window = matchWindow(bill.frequency);

    await db.execute(
      `UPDATE expense SET status = 'inactive'
      WHERE user_id = ? AND recurring_id = ? AND source = 'auto' AND status = 'active'
        AND ABS(DATEDIFF(date_created, ?)) <= ?`,
      [userId, bill.id, date, window]
    );

    const gap = daysBetween(date, bill.next_due);
    if (advance && gap >= 0 && gap <= window) {
      bill.next_due = addCycle(bill.next_due, bill.frequency, bill.due_day);
    }

    const isNewest = !bill.last_paid || date > bill.last_paid;
    if (isNewest) {
      if (!bill.varies && Math.abs(amount - bill.amount) >= 1) {
        await logPriceChange(db, userId, bill.id, bill.amount, amount, date);
        if (daysBetween(date, today()) <= PRICE_ALERT_DAYS) {
          const direction = amount > bill.amount ? "went up" : "went down";
          await notify(db, userId, `${bill.name} ${direction} by ${money(Math.abs(amount - bill.amount))}, to ${money(amount)}.`);
        }
      }
      bill.amount = bill.varies ? round((bill.amount + amount) / 2) : amount;
      bill.last_paid = date;
    }

    await db.execute(
      "UPDATE recurring_payments SET next_due = ?, amount = ?, last_paid = ? WHERE id = ?",
      [bill.next_due, bill.amount, bill.last_paid, bill.id]
    );
  }
};

const sendDueReminders = async () => {
  const [bills] = await connection.execute(
    `SELECT r.id, r.user_id, r.name, r.amount, r.varies, DATE_FORMAT(r.next_due, '%Y-%m-%d') AS next_due,
      u.email, u.bill_reminders
    FROM recurring_payments r JOIN users u ON u.user_id = r.user_id
    WHERE r.status = 'active' AND r.next_due <= ?
      AND (r.reminded_for IS NULL OR r.reminded_for <> r.next_due)`,
    [addDays(today(), REMINDER_DAYS)]
  );

  const byUser = new Map();
  for (const bill of bills) {
    const line = `${bill.name} is due on ${longDate(bill.next_due)}: ${bill.varies ? "about " : ""}${money(bill.amount)}.`;
    await notify(connection, bill.user_id, line);
    await connection.execute("UPDATE recurring_payments SET reminded_for = next_due WHERE id = ?", [bill.id]);
    if (bill.bill_reminders === 1) byUser.set(bill.email, [...(byUser.get(bill.email) ?? []), line]);
  }
  for (const [email, lines] of byUser) await sendReminderEmail(email, lines);
};

const flagMissed = async () => {
  const [rows] = await connection.execute(
    `SELECT r.id, r.user_id, r.name, DATE_FORMAT(MAX(e.date_created), '%Y-%m-%d') AS date
    FROM expense e JOIN recurring_payments r ON r.id = e.recurring_id
    WHERE e.source = 'auto' AND e.status = 'active' AND e.needs_review = 1 AND r.status = 'active'
      AND e.date_created <= ?
    GROUP BY r.id, r.user_id, r.name, r.missed_for
    HAVING r.missed_for IS NULL OR r.missed_for < MAX(e.date_created)`,
    [addDays(today(), -MISSED_AFTER_DAYS)]
  );
  for (const { id, user_id: userId, name, date } of rows) {
    await notify(connection, userId, `We added ${name} on ${longDate(date)} but haven't seen the payment. Please confirm it.`);
    await connection.execute("UPDATE recurring_payments SET missed_for = ? WHERE id = ?", [date, id]);
  }
};

export const runBillJob = async () => {
  const [users] = await connection.execute(
    "SELECT DISTINCT user_id FROM recurring_payments WHERE status = 'active' AND next_due <= ?",
    [today()]
  );
  for (const { user_id: userId } of users) await captureDue(userId);
  await sendDueReminders();
  await flagMissed();
};

// What the dashboard shows: the week's bills and captures waiting on the user.
export const billsAttention = async (userId) => {
  const [[due]] = await connection.execute(
    `SELECT COUNT(*) AS count, COALESCE(SUM(amount), 0) AS total FROM recurring_payments
    WHERE user_id = ? AND status = 'active' AND next_due <= ?`,
    [userId, addDays(today(), 7)]
  );
  const [[unconfirmed]] = await connection.execute(
    `SELECT COUNT(*) AS count FROM expense
    WHERE user_id = ? AND source = 'auto' AND status = 'active' AND needs_review = 1`,
    [userId]
  );
  return { dueCount: due.count, dueTotal: Number(due.total), toConfirm: unconfirmed.count };
};

// Average money in over the last few full months, from statements and by hand.
export const usualMoneyIn = async (userId) => {
  const [rows] = await connection.execute(
    `SELECT month, SUM(total) AS total FROM (
      SELECT DATE_FORMAT(occurred_at, '%Y-%m') AS month, SUM(paid_in) AS total FROM mpesa_transactions
      WHERE user_id = ? AND occurred_at < DATE_FORMAT(CURDATE(), '%Y-%m-01')
      GROUP BY month
      UNION ALL
      SELECT DATE_FORMAT(received_on, '%Y-%m') AS month, SUM(amount) AS total FROM account_income
      WHERE user_id = ? AND received_on < DATE_FORMAT(CURDATE(), '%Y-%m-01')
      GROUP BY month
    ) AS money GROUP BY month ORDER BY month DESC LIMIT ${INCOME_MONTHS}`,
    [userId, userId]
  );
  if (rows.length === 0) return null;
  return Math.round(rows.reduce((sum, row) => sum + Number(row.total), 0) / rows.length);
};

export const weekAhead = () => addDays(today(), 7);

// The seven days from now on that take the most, once there's more than one payment.
export const heaviestWeek = (upcoming) => {
  let heaviest = null;
  for (const { date } of upcoming) {
    const end = addDays(date, 6);
    const inside = upcoming.filter((item) => item.date >= date && item.date <= end);
    const total = inside.reduce((sum, item) => sum + item.amount, 0);
    if (inside.length > 1 && total > (heaviest?.total ?? 0)) {
      heaviest = { from: date, to: inside.at(-1).date, total: round(total) };
    }
  }
  return heaviest;
};

export const buildCalendar = async (userId, month) => {
  const lastDay = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5)), 0)).getUTCDate();
  const monthEnd = `${month}-${pad(lastDay)}`;
  const tracked = await loadTracked(userId);

  const upcoming = tracked
    .filter((bill) => bill.status === "active")
    .flatMap((bill) => {
      const dates = [];
      for (let date = bill.next_due; date <= monthEnd; date = addCycle(date, bill.frequency, bill.due_day)) {
        if (date.startsWith(month)) dates.push(date);
      }
      return dates.map((date) => ({
        id: `due-${bill.id}-${date}`,
        recurringId: bill.id,
        name: bill.name,
        kind: bill.kind,
        amount: bill.amount,
        varies: bill.varies,
        date,
        status: "due",
        canAct: date === bill.next_due,
      }));
    });

  const [recorded] = await connection.execute(
    `SELECT e.expense_id, e.amount, e.source, e.needs_review, r.name, r.kind,
      DATE_FORMAT(e.date_created, '%Y-%m-%d') AS date
    FROM expense e JOIN recurring_payments r ON r.id = e.recurring_id
    WHERE e.user_id = ? AND e.status = 'active' AND e.date_created BETWEEN ? AND ?`,
    [userId, `${month}-01`, monthEnd]
  );
  const past = recorded.map((row) => ({
    id: `expense-${row.expense_id}`,
    name: row.name,
    kind: row.kind,
    amount: Number(row.amount),
    varies: false,
    date: row.date,
    status: row.source === "auto" && row.needs_review === 1 ? "confirm" : "paid",
    canAct: false,
  }));

  return {
    month,
    today: today(),
    items: [...past, ...upcoming].sort((a, b) => a.date.localeCompare(b.date)),
    heavyWeek: heaviestWeek(upcoming.filter((item) => item.date >= today())),
  };
};
