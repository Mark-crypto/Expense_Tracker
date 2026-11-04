import connection from "../database.js";
import { latestStatement } from "./accounts.js";
import { addDays, daysBetween, lastDayOf, today } from "./dates.js";
import { goalHold, loadGoals } from "./goals.js";
import { addCycle, heaviestWeek } from "./recurring.js";

const IRREGULAR_DAYS = 30;
const LOW_BALANCE_DAYS = 14;
const COMING_UP_DAYS = 14;
const pad = (value) => String(value).padStart(2, "0");

const nextPayday = (from, payDay) => {
  const inMonth = (month) => `${month}-${pad(Math.min(payDay, lastDayOf(month)))}`;
  const thisMonth = inMonth(from.slice(0, 7));
  if (thisMonth > from) return thisMonth;
  return inMonth(addDays(`${from.slice(0, 7)}-28`, 7).slice(0, 7));
};

// Every payment from today up to, but not including, the end date.
export const paymentsBefore = (tracked, end) =>
  tracked
    .filter((bill) => bill.status === "active")
    .flatMap((bill) => {
      const dates = [];
      for (let date = bill.next_due; date < end; date = addCycle(date, bill.frequency, bill.due_day)) dates.push(date);
      return dates.map((date) => ({
        id: bill.id,
        name: bill.name,
        kind: bill.kind,
        category: bill.category,
        amount: bill.amount,
        varies: bill.varies,
        accountId: bill.account_id,
        date,
        canAct: date === bill.next_due,
      }));
    })
    .sort((a, b) => a.date.localeCompare(b.date));

const spentToday = async (userId, accounts) => {
  const ids = accounts.filter((account) => account.spendable).map((account) => account.id);
  if (accounts.length > 0 && ids.length === 0) return 0;
  const [[{ total }]] = await connection.query(
    `SELECT COALESCE(SUM(amount), 0) AS total FROM expense
    WHERE user_id = ? AND status = 'active' AND date_created = ? AND recurring_id IS NULL
    ${ids.length > 0 ? "AND account_id IN (?)" : ""}`,
    [userId, today(), ...(ids.length > 0 ? [ids] : [])]
  );
  return Number(total);
};

const spentSince = async (userId, date) => {
  const [[{ total }]] = await connection.execute(
    `SELECT COALESCE(SUM(amount), 0) AS total FROM expense
    WHERE user_id = ? AND status = 'active' AND source <> 'mpesa' AND date_created > ?`,
    [userId, date]
  );
  return Number(total);
};

// Without accounts the last statement stands in as a labelled estimate.
const moneyAvailable = async (userId, accounts) => {
  if (accounts.length > 0) {
    return {
      amount: accounts.filter((account) => account.spendable).reduce((sum, account) => sum + account.balance, 0),
      statementDate: null,
    };
  }
  const statement = await latestStatement(userId);
  if (!statement) return null;
  return { amount: statement.balance - (await spentSince(userId, statement.date)), statementDate: statement.date };
};

// The Dashboard's two-week view of tracked payments.
export const buildComingUp = (tracked, suggestions) => {
  const now = today();
  const items = paymentsBefore(tracked, addDays(now, COMING_UP_DAYS));
  return {
    tracked: tracked.filter((bill) => bill.status === "active").length,
    suggestions,
    days: Array.from({ length: COMING_UP_DAYS }, (_, index) => addDays(now, index)),
    items,
    total: Math.round(items.reduce((sum, item) => sum + item.amount, 0)),
    heavyWeek: heaviestWeek(items),
  };
};

export const loadPaySettings = async (userId) => {
  const [[row]] = await connection.execute(
    "SELECT pay_type, pay_day, safety_buffer FROM users WHERE user_id = ?",
    [userId]
  );
  return { payType: row.pay_type, payDay: row.pay_day, buffer: Number(row.safety_buffer) };
};

export const buildSafeToSpend = async (userId, accounts, tracked) => {
  const settings = await loadPaySettings(userId);
  const available = await moneyAvailable(userId, accounts);
  if (!available) return { ready: false, ...settings };

  const now = today();
  const salaried = settings.payType === "salary" && settings.payDay;
  const until = salaried ? nextPayday(now, settings.payDay) : addDays(now, IRREGULAR_DAYS);
  const days = Math.max(daysBetween(now, until), 1);
  const due = paymentsBefore(tracked, until).reduce((sum, item) => sum + item.amount, 0);
  const spent = await spentToday(userId, accounts);
  const goals = goalHold(await loadGoals(userId, accounts), until);

  // Today's spending is added back so the day's number holds still as you spend.
  const thisMorning = available.amount + spent;
  const pool = thisMorning - due - goals - settings.buffer;
  const daily = Math.max(pool, 0) / days;

  return {
    ready: true,
    ...settings,
    salaried: !!salaried,
    until,
    days,
    thisMorning: Math.round(thisMorning),
    due: Math.round(due),
    goals: Math.round(goals),
    pool: Math.round(pool),
    daily: Math.round(daily),
    spentToday: Math.round(spent),
    leftToday: Math.round(Math.max(daily - spent, 0)),
    statementDate: available.statementDate,
  };
};

// Runs each account forward through its coming payments and stops at the first shortfall.
export const findLowBalance = (accounts, tracked) => {
  if (accounts.length === 0) return null;
  const fallback = accounts[0].id;
  const known = new Set(accounts.map((account) => account.id));
  const payments = paymentsBefore(tracked, addDays(today(), LOW_BALANCE_DAYS)).map((item) => ({
    ...item,
    accountId: known.has(item.accountId) ? item.accountId : fallback,
  }));

  const left = new Map(accounts.map((account) => [account.id, account.balance]));
  let shortfall = null;
  for (const item of payments) {
    left.set(item.accountId, left.get(item.accountId) - item.amount);
    if (!shortfall && left.get(item.accountId) < 0) shortfall = item;
  }
  if (!shortfall) return null;

  const short = Math.ceil(-left.get(shortfall.accountId));
  const account = accounts.find((row) => row.id === shortfall.accountId);
  const source = accounts
    .filter((row) => row.id !== account.id && row.spendable && left.get(row.id) >= short)
    .sort((a, b) => left.get(b.id) - left.get(a.id))[0];

  return {
    name: shortfall.name,
    date: shortfall.date,
    accountId: account.id,
    accountName: account.name,
    short,
    fromId: source?.id ?? null,
    fromName: source?.name ?? null,
  };
};
