import connection from "../database.js";
import { lastDayOf } from "./dates.js";
import { suggestCategory } from "./extractMpesaLines.js";

const MAP_GROUPS = 8;
const LIST_SIZE = 5;
const MIN_FINDING_CHANGE = 0.2;
const MIN_FINDING_AMOUNT = 500;
const MIN_FEE_CHANGE = 100;
const MAX_FINDINGS = 3;

const COSTS = ["fees", "fuliza", "loans"];
const LABELS = { fees: "M-Pesa fees", fuliza: "Fuliza repayments" };

const money = (value) => `KES ${Math.round(value).toLocaleString("en-KE")}`;
const round = (value) => Math.round(value);

const isPerson = (row) => row.kind === "send" || /customer transfer|funds received from/i.test(row.details);

// Where money leaving M-Pesa went. A user's own category wins over our guess.
const outKey = (row) => {
  if (row.kind === "fee") return "fees";
  if (row.kind === "fuliza") return "fuliza";
  if (row.kind === "loan") return "loans";
  if (row.transfer_status === "transfer") return "moves";
  if (row.expenseCategory) return row.kind === "send" && row.expenseCategory === "miscellaneous" ? "people" : row.expenseCategory;
  if (row.kind === "withdrawal") return "cash";
  if (row.kind === "send") return "people";
  return suggestCategory(row.kind, row.details);
};

const sourceKey = (row) => {
  if (row.transfer_status === "transfer") return "moves";
  if (row.kind === "fuliza") return "fuliza";
  if (row.kind === "loan") return "loans";
  if (row.kind === "savings") return "savings";
  if (/deposit/i.test(row.details)) return "deposits";
  if (/business payment|salary|b2c/i.test(row.details)) return "business";
  return isPerson(row) ? "people" : "other";
};

const nameOf = (row) => row.counterparty || row.details.replace(/\s+-\s+.*$/, "").slice(0, 60);

const loadRows = async (userId) => {
  const [rows] = await connection.execute(
    `SELECT m.kind, m.details, m.counterparty, m.paid_in, m.withdrawn, m.transfer_status,
      DATE_FORMAT(m.occurred_at, '%Y-%m-%d') AS date, e.category AS expenseCategory
    FROM mpesa_transactions m
    LEFT JOIN expense e ON e.user_id = m.user_id AND e.receipt_no = m.receipt_no
      AND e.status = 'active' AND m.kind <> 'fee'
    WHERE m.user_id = ?
    ORDER BY m.occurred_at`,
    [userId]
  );
  return rows.map((row) => ({ ...row, paidIn: Number(row.paid_in), withdrawn: Number(row.withdrawn) }));
};

const addTo = (map, key, row, amount) => {
  const group = map.get(key) ?? { key, total: 0, count: 0, merchants: new Map() };
  group.total += amount;
  group.count += 1;
  const name = nameOf(row);
  const merchant = group.merchants.get(name) ?? { name, total: 0, count: 0 };
  merchant.total += amount;
  merchant.count += 1;
  group.merchants.set(name, merchant);
  map.set(key, group);
};

const tidy = (merchants, limit) =>
  [...merchants.values()]
    .sort((a, b) => b.total - a.total)
    .slice(0, limit)
    .map((merchant) => ({ ...merchant, total: round(merchant.total) }));

const summarise = (rows) => {
  const outs = new Map();
  const sources = new Map();
  const recipients = { people: new Map(), businesses: new Map() };

  for (const row of rows) {
    if (row.paidIn > 0) addTo(sources, sourceKey(row), row, row.paidIn);
    if (row.withdrawn > 0) {
      const key = outKey(row);
      addTo(outs, key, row, row.withdrawn);
      if (["send", "paybill", "till"].includes(row.kind) && row.counterparty && key !== "moves") {
        addTo(recipients[row.kind === "send" ? "people" : "businesses"], "all", row, row.withdrawn);
      }
    }
  }

  const moneyIn = [...sources.values()].reduce((sum, group) => sum + group.total, 0);
  const moneyOut = [...outs.values()].reduce((sum, group) => sum + group.total, 0);
  return { outs, sources, recipients, moneyIn, moneyOut };
};

const change = (now, before) => (before > 0 ? (now - before) / before : null);

const changeWords = (label, now, before) => {
  const share = change(now, before);
  if (share >= 0.9) return `${label} almost doubled to ${money(now)}.`;
  const percent = Math.round(Math.abs(share) * 100);
  return `${label} ${share > 0 ? "rose" : "fell"} ${percent}% to ${money(now)}.`;
};

// Plain sentences comparing a month with the one before. Needs two months.
const compareMonths = (current, previous) => {
  const findings = [];
  const totalOf = (summary, key) => summary.outs.get(key)?.total ?? 0;

  const fees = [totalOf(current, "fees"), totalOf(previous, "fees")];
  const feeShare = change(...fees);
  if (feeShare !== null && Math.abs(feeShare) >= MIN_FINDING_CHANGE && Math.abs(fees[0] - fees[1]) >= MIN_FEE_CHANGE) {
    findings.push(changeWords(LABELS.fees, ...fees));
  }

  const growth = [...current.outs.values()]
    .filter((group) => !COSTS.includes(group.key) && group.key !== "moves")
    .map((group) => ({ group, before: previous.outs.get(group.key) }))
    .filter(({ group, before }) => before && group.total - before.total >= MIN_FINDING_AMOUNT && change(group.total, before.total) >= MIN_FINDING_CHANGE)
    .sort((a, b) => b.group.total - b.before.total - (a.group.total - a.before.total))[0];
  if (growth) {
    const { group, before } = growth;
    const merchant = [...group.merchants.values()]
      .map((row) => ({ ...row, rise: row.total - (before.merchants.get(row.name)?.total ?? 0) }))
      .sort((a, b) => b.rise - a.rise)[0];
    const mostly = merchant && merchant.rise >= (group.total - before.total) / 2 ? `, mostly at ${merchant.name}` : "";
    findings.push(`{{${group.key}}} went up ${money(group.total - before.total)}${mostly}.`);
  }

  const fuliza = [totalOf(current, "fuliza"), totalOf(previous, "fuliza")];
  const fulizaShare = change(...fuliza);
  if (fulizaShare !== null && Math.abs(fulizaShare) >= MIN_FINDING_CHANGE && Math.abs(fuliza[0] - fuliza[1]) >= MIN_FINDING_AMOUNT / 5) {
    findings.push(changeWords(LABELS.fuliza, ...fuliza));
  }

  return findings;
};

const facts = (summary, months) => {
  const findings = [];
  const fees = summary.outs.get("fees")?.total ?? 0;
  if (fees > 0) findings.push(`Fees cost you ${money(fees)} across ${months} months.`);
  const biggest = [...summary.outs.values()].filter((group) => group.key !== "moves").sort((a, b) => b.total - a.total)[0];
  if (biggest && summary.moneyOut > 0) {
    findings.push(`{{${biggest.key}}} is ${Math.round((biggest.total / summary.moneyOut) * 100)}% of all money out.`);
  }
  return findings;
};

const keptFinding = ({ moneyIn, moneyOut }) => {
  if (moneyIn <= 0) return null;
  const kept = moneyIn - moneyOut;
  return kept >= 0
    ? `You kept ${Math.round((kept / moneyIn) * 100)}% of what came in.`
    : `You spent ${money(-kept)} more than came in.`;
};

const frequentFinding = (summary) => {
  const merchants = [...summary.outs.values()]
    .filter((group) => !COSTS.includes(group.key))
    .flatMap((group) => [...group.merchants.values()]);
  const top = merchants.sort((a, b) => b.count - a.count)[0];
  return top && top.count >= 3 ? `${top.name} was your most frequent payment, ${top.count} times.` : null;
};

export const buildMoneyXray = async (userId, requested) => {
  const rows = await loadRows(userId);
  if (rows.length === 0) return null;

  const months = [...new Set(rows.map((row) => row.date.slice(0, 7)))].sort();
  const period = requested === "all" || months.includes(requested) ? requested : months.at(-1);
  const chosen = period === "all" ? rows : rows.filter((row) => row.date.startsWith(period));
  const summary = summarise(chosen);

  let findings = null;
  if (months.length >= 2) {
    const index = months.indexOf(period);
    const previous = index > 0 ? summarise(rows.filter((row) => row.date.startsWith(months[index - 1]))) : null;
    findings = [
      ...(period === "all" ? facts(summary, months.length) : previous ? compareMonths(summary, previous) : []),
      keptFinding(summary),
      frequentFinding(summary),
    ]
      .filter(Boolean)
      .slice(0, MAX_FINDINGS);
  }

  const outs = [...summary.outs.values()].sort((a, b) => b.total - a.total);
  // Folding a single group would only hide its name.
  const shown = outs.length > MAP_GROUPS + 1 ? MAP_GROUPS : outs.length;
  const mapped = outs.slice(0, shown);
  const folded = outs.slice(shown);
  const costTotal = COSTS.reduce((sum, key) => sum + (summary.outs.get(key)?.total ?? 0), 0);
  const nonMoves = summary.moneyOut - (summary.outs.get("moves")?.total ?? 0);
  const from = chosen[0].date;
  const to = chosen.at(-1).date;

  return {
    months,
    period,
    range: { from, to },
    periodRange:
      period === "all"
        ? { from: `${months[0]}-01`, to: `${months.at(-1)}-${String(lastDayOf(months.at(-1))).padStart(2, "0")}` }
        : { from: `${period}-01`, to: `${period}-${String(lastDayOf(period)).padStart(2, "0")}` },
    moneyIn: round(summary.moneyIn),
    moneyOut: round(summary.moneyOut),
    kept: round(summary.moneyIn - summary.moneyOut),
    sources: [...summary.sources.values()]
      .sort((a, b) => b.total - a.total)
      .map(({ key, total, count }) => ({ key, total: round(total), count })),
    outs: outs.map(({ key, total, count, merchants }) => ({
      key,
      total: round(total),
      count,
      merchants: tidy(merchants, 8),
    })),
    map: [
      ...mapped.map(({ key, total }) => ({ key, total: round(total) })),
      ...(folded.length > 0 ? [{ key: "rest", total: round(folded.reduce((sum, group) => sum + group.total, 0)) }] : []),
    ],
    costs: {
      rows: COSTS.map((key) => ({ key, total: round(summary.outs.get(key)?.total ?? 0), count: summary.outs.get(key)?.count ?? 0 })),
      total: round(costTotal),
      share: nonMoves > 0 ? Math.round((costTotal / nonMoves) * 1000) / 10 : 0,
      fulizaBorrowed: round(summary.sources.get("fuliza")?.total ?? 0),
    },
    people: tidy(summary.recipients.people.get("all")?.merchants ?? new Map(), LIST_SIZE),
    businesses: tidy(summary.recipients.businesses.get("all")?.merchants ?? new Map(), LIST_SIZE),
    findings,
  };
};
