import connection from "../database.js";
import { addDays, lastDayOf, today } from "./dates.js";

const QUESTION_LIMIT = 5;
const ACTIVITY_LIMIT = 8;
const NEVER = "9999-12-31";
const BANK_NAME = /\b(equity|kcb|co-?op|ncba|absa|stanbic|dtb|family bank|i&m|standard chartered|sidian|bank)\b/i;

const ACCOUNT_ORDER = "FIELD(type, 'mpesa', 'bank', 'cash', 'savings', 'other'), id";
const STAMP = "'%Y-%m-%d %H:%i:%s.%f'";

export const chooseAccount = async (db, userId, wanted) => {
  const [rows] = await db.execute(
    `SELECT id FROM accounts WHERE user_id = ? AND status = 'active' ORDER BY ${ACCOUNT_ORDER}`,
    [userId]
  );
  return rows.find((row) => row.id === Number(wanted))?.id ?? rows[0]?.id ?? null;
};

export const accountOfType = async (db, userId, type) => {
  const [[account]] = await db.execute(
    "SELECT id FROM accounts WHERE user_id = ? AND type = ? AND status = 'active' ORDER BY id LIMIT 1",
    [userId, type]
  );
  return account?.id ?? null;
};

export const recordBalance = (db, userId, accountId, balance, asOf, source) =>
  db.execute(
    `INSERT INTO account_balances (user_id, account_id, balance, as_of, source) VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE balance = VALUES(balance), source = VALUES(source), recorded_at = CURRENT_TIMESTAMP(3)`,
    [userId, accountId, balance, asOf, source]
  );

// Statements print newest first, so the higher id is the earlier of two rows in the same second.
const statementRows = async (db, userId) => {
  const [rows] = await db.execute(
    `SELECT balance, paid_in, withdrawn, DATE_FORMAT(occurred_at, '%Y-%m-%d') AS date
    FROM mpesa_transactions WHERE user_id = ? AND balance IS NOT NULL
    ORDER BY occurred_at, id DESC`,
    [userId]
  );
  return rows.map((row) => ({
    date: row.date,
    balance: Number(row.balance),
    paidIn: Number(row.paid_in),
    withdrawn: Number(row.withdrawn),
  }));
};

// A balance for the day before the first row and for the end of each month, so
// past reports work and the latest row becomes the current balance.
export const syncStatementBalances = async (db, userId, accountId) => {
  const rows = await statementRows(db, userId);
  if (rows.length === 0) return;
  const [first] = rows;
  await recordBalance(db, userId, accountId, first.balance + first.withdrawn - first.paidIn, addDays(first.date, -1), "statement");
  const monthEnds = new Map(rows.map((row) => [row.date.slice(0, 7), row]));
  for (const { balance, date } of monthEnds.values()) {
    await recordBalance(db, userId, accountId, balance, date, "statement");
  }
};

export const latestStatement = async (userId) => {
  const rows = await statementRows(connection, userId);
  const last = rows.at(-1);
  return last ? { balance: last.balance, date: last.date } : null;
};

// Statement rows are left out: their effect arrives through the statement balance.
const loadMoves = async (userId) => {
  const [expenses] = await connection.execute(
    `SELECT account_id, amount, DATE_FORMAT(date_created, '%Y-%m-%d') AS date, DATE_FORMAT(created_at, ${STAMP}) AS at
    FROM expense WHERE user_id = ? AND status = 'active' AND account_id IS NOT NULL AND source <> 'mpesa'`,
    [userId]
  );
  const [income] = await connection.execute(
    `SELECT account_id, amount, DATE_FORMAT(received_on, '%Y-%m-%d') AS date, DATE_FORMAT(created_at, ${STAMP}) AS at
    FROM account_income WHERE user_id = ?`,
    [userId]
  );
  const [transfers] = await connection.execute(
    `SELECT from_account_id, to_account_id, amount, DATE_FORMAT(moved_on, '%Y-%m-%d') AS date, DATE_FORMAT(created_at, ${STAMP}) AS at
    FROM account_transfers WHERE user_id = ?`,
    [userId]
  );
  return [
    ...expenses.map(({ account_id, amount, date, at }) => ({ accountId: account_id, amount: -Number(amount), date, at })),
    ...income.map(({ account_id, amount, date, at }) => ({ accountId: account_id, amount: Number(amount), date, at })),
    ...transfers.flatMap(({ from_account_id, to_account_id, amount, date, at }) => [
      { accountId: from_account_id, amount: -Number(amount), date, at, transfer: true },
      { accountId: to_account_id, amount: Number(amount), date, at, transfer: true },
    ]),
  ];
};

const latestBalanceBy = (account, date) => account.anchors.findLast((anchor) => anchor.as_of <= date) ?? null;

// Something recorded after a balance was set on the same day isn't in that balance yet.
const happenedAfter = (move, anchor) =>
  move.date > anchor.as_of || (move.date === anchor.as_of && move.at > anchor.recorded_at);

const balanceOn = (account, moves, date) => {
  const anchor = latestBalanceBy(account, date);
  if (!anchor) return null;
  return moves
    .filter((move) => move.accountId === account.id && move.date <= date && happenedAfter(move, anchor))
    .reduce((sum, move) => sum + move.amount, anchor.balance);
};

export const loadAccounts = async (userId) => {
  const [accounts] = await connection.execute(
    `SELECT id, name, type, spendable FROM accounts WHERE user_id = ? AND status = 'active' ORDER BY ${ACCOUNT_ORDER}`,
    [userId]
  );
  if (accounts.length === 0) return { accounts: [], moves: [] };

  const [anchors] = await connection.execute(
    `SELECT account_id, balance, source, DATE_FORMAT(as_of, '%Y-%m-%d') AS as_of, DATE_FORMAT(recorded_at, ${STAMP}) AS recorded_at
    FROM account_balances WHERE user_id = ? ORDER BY as_of`,
    [userId]
  );
  const moves = await loadMoves(userId);

  return {
    moves,
    accounts: accounts.map((account) => {
      const own = anchors
        .filter((anchor) => anchor.account_id === account.id)
        .map((anchor) => ({ ...anchor, balance: Number(anchor.balance) }));
      const row = { ...account, spendable: account.spendable === 1, anchors: own };
      const latest = own.at(-1);
      return {
        ...row,
        balance: Math.round((balanceOn(row, moves, NEVER) ?? 0) * 100) / 100,
        updatedOn: latest?.as_of ?? null,
        updatedFrom: latest?.source ?? null,
      };
    }),
  };
};

const statementTotals = async (userId, from, to) => {
  const [[row]] = await connection.execute(
    `SELECT COALESCE(SUM(paid_in), 0) AS paidIn, COALESCE(SUM(withdrawn), 0) AS withdrawn,
      DATE_FORMAT((SELECT MAX(occurred_at) FROM mpesa_transactions WHERE user_id = ?), '%Y-%m-%d') AS lastDate
    FROM mpesa_transactions
    WHERE user_id = ? AND occurred_at >= ? AND occurred_at < ?`,
    [userId, userId, from, addDays(to, 1)]
  );
  return { paidIn: Number(row.paidIn), withdrawn: Number(row.withdrawn), lastDate: row.lastDate };
};

export const reportMonths = (accounts) => {
  const firsts = accounts.flatMap(({ anchors }) => anchors[0]?.as_of ?? []).sort();
  if (firsts.length === 0) return [];
  const months = [];
  for (let month = today().slice(0, 7); month >= firsts[0].slice(0, 7); ) {
    months.push(month);
    month = addDays(`${month}-01`, -1).slice(0, 7);
  }
  return months;
};

const rounded = (value) => Math.round(value);

export const buildReport = async (userId, { accounts, moves }, month) => {
  const first = `${month}-01`;
  const end = [`${month}-${String(lastDayOf(month)).padStart(2, "0")}`, today()].sort()[0];
  const before = addDays(first, -1);
  const statement = await statementTotals(userId, first, end);

  const rows = accounts.flatMap((account) => {
    const opening = account.anchors[0];
    if (!opening || opening.as_of > end) return [];
    const prior = latestBalanceBy(account, before);
    const isMpesa = account.type === "mpesa";
    const inMonth = moves.filter(
      (move) =>
        move.accountId === account.id &&
        move.date >= first &&
        move.date <= end &&
        (prior || happenedAfter(move, opening)) &&
        !(isMpesa && statement.lastDate && move.date <= statement.lastDate)
    );
    const moneyIn = inMonth.filter((move) => move.amount > 0).reduce((sum, move) => sum + move.amount, 0);
    const moneyOut = inMonth.filter((move) => move.amount < 0).reduce((sum, move) => sum - move.amount, 0);
    const start = prior ? balanceOn(account, moves, before) : opening.balance;
    const closing = balanceOn(account, moves, end);
    // Moves between accounts aren't a loss, so they don't decide which account fell most.
    const moved = moves
      .filter((move) => move.transfer && move.accountId === account.id && move.date >= first && move.date <= end)
      .reduce((sum, move) => sum + move.amount, 0);
    const inTotal = moneyIn + (isMpesa ? statement.paidIn : 0);
    const outTotal = moneyOut + (isMpesa ? statement.withdrawn : 0);
    return {
      id: account.id,
      name: account.name,
      type: account.type,
      start: rounded(start),
      moneyIn: rounded(inTotal),
      moneyOut: rounded(outTotal),
      end: rounded(closing),
      change: rounded(closing - start),
      adjusted: rounded(closing - start - inTotal + outTotal),
      realChange: rounded(closing - start - moved),
    };
  });

  const sum = (field) => rows.reduce((total, row) => total + row[field], 0);
  const biggestFall = rows.filter((row) => row.realChange < 0).sort((a, b) => a.realChange - b.realChange)[0];
  return {
    month,
    complete: end < today(),
    rows,
    biggestFall: biggestFall?.name ?? null,
    totals: {
      start: sum("start"),
      moneyIn: sum("moneyIn"),
      moneyOut: sum("moneyOut"),
      end: sum("end"),
      change: sum("change"),
      adjusted: sum("adjusted"),
    },
  };
};

const targetFor = (row, accounts, ownName) => {
  const ofType = (type) => accounts.find((account) => account.type === type);
  const named = `${row.counterparty ?? ""} ${row.details}`;
  if (row.kind === "savings") return ofType("savings") && { account: ofType("savings"), reason: "This looks like a move to your savings." };
  if (BANK_NAME.test(named) && ofType("bank")) return { account: ofType("bank"), reason: "This looks like your bank." };
  if (row.counterparty?.trim().toLowerCase() === ownName) {
    return accounts.find((account) => account.type !== "mpesa") && {
      account: accounts.find((account) => account.type !== "mpesa"),
      reason: "This name matches yours.",
    };
  }
  return null;
};

// Only statement rows we can't be sure about, and only since the account existed.
export const transferQuestions = async (userId, accounts) => {
  const mpesa = accounts.find((account) => account.type === "mpesa");
  if (!mpesa || accounts.length < 2) return { items: [], total: 0 };
  const [[user]] = await connection.execute("SELECT name FROM users WHERE user_id = ?", [userId]);
  const [rows] = await connection.execute(
    `SELECT id, kind, counterparty, details, paid_in, withdrawn, DATE_FORMAT(occurred_at, '%Y-%m-%d') AS date
    FROM mpesa_transactions
    WHERE user_id = ? AND transfer_status IS NULL AND kind IN ('paybill', 'received', 'send', 'savings')
    ORDER BY occurred_at DESC`,
    [userId]
  );
  const ownName = user.name.trim().toLowerCase();
  const items = rows.flatMap((row) => {
    const target = targetFor(row, accounts, ownName);
    if (!target || !target.account.anchors[0] || row.date < target.account.anchors[0].as_of) return [];
    const incoming = Number(row.paid_in) > 0;
    return {
      id: row.id,
      name: row.counterparty || row.details,
      date: row.date,
      amount: Number(incoming ? row.paid_in : row.withdrawn),
      incoming,
      accountId: target.account.id,
      accountName: target.account.name,
      reason: target.reason,
    };
  });
  return { items: items.slice(0, QUESTION_LIMIT), total: items.length };
};

export const recentActivity = async (userId) => {
  const [income] = await connection.execute(
    `SELECT i.id, i.amount, i.name, a.name AS account, DATE_FORMAT(i.received_on, '%Y-%m-%d') AS date
    FROM account_income i JOIN accounts a ON a.id = i.account_id
    WHERE i.user_id = ? ORDER BY i.received_on DESC, i.id DESC LIMIT ${ACTIVITY_LIMIT}`,
    [userId]
  );
  const [transfers] = await connection.execute(
    `SELECT t.id, t.amount, f.name AS from_name, o.name AS to_name, DATE_FORMAT(t.moved_on, '%Y-%m-%d') AS date
    FROM account_transfers t
    JOIN accounts f ON f.id = t.from_account_id JOIN accounts o ON o.id = t.to_account_id
    WHERE t.user_id = ? AND t.receipt_no IS NULL ORDER BY t.moved_on DESC, t.id DESC LIMIT ${ACTIVITY_LIMIT}`,
    [userId]
  );
  return [
    ...income.map((row) => ({
      key: `income-${row.id}`,
      path: `/accounts/income/${row.id}`,
      title: row.name,
      detail: `Money in to ${row.account}`,
      amount: Number(row.amount),
      date: row.date,
    })),
    ...transfers.map((row) => ({
      key: `transfer-${row.id}`,
      path: `/accounts/transfers/${row.id}`,
      title: `${row.from_name} to ${row.to_name}`,
      detail: "Moved between accounts",
      amount: Number(row.amount),
      date: row.date,
    })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, ACTIVITY_LIMIT);
};

// Money recorded by hand that a statement doesn't already include, for the Money in totals.
export const manualIncomeByMonth = async (userId, { accounts }) => {
  const mpesa = accounts.find((account) => account.type === "mpesa");
  const { lastDate } = await statementTotals(userId, today(), today());
  const [rows] = await connection.execute(
    `SELECT account_id, amount, DATE_FORMAT(received_on, '%Y-%m-%d') AS date
    FROM account_income WHERE user_id = ? AND received_on >= DATE_FORMAT(CURDATE() - INTERVAL 12 MONTH, '%Y-%m-01')`,
    [userId]
  );
  const totals = new Map();
  for (const { account_id: accountId, amount, date } of rows) {
    if (accountId === mpesa?.id && lastDate && date <= lastDate) continue;
    const month = date.slice(0, 7);
    totals.set(month, (totals.get(month) ?? 0) + Number(amount));
  }
  return totals;
};
