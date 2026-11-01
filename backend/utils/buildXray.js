const money = (value) => Math.round(value * 100) / 100;

const sumOf = (rows, field) =>
  money(rows.reduce((total, row) => total + Number(row[field]), 0));

const RECIPIENT_KINDS = ["send", "paybill", "till"];

// Works from statement rows, before or after they're saved.
export const buildXray = (rows) => {
  if (rows.length === 0) return null;

  const ofKind = (kind) => rows.filter((row) => row.kind === kind);
  const summary = (kind) => ({
    total: sumOf(ofKind(kind), "withdrawn"),
    count: ofKind(kind).length,
  });

  const recipients = new Map();
  for (const row of rows) {
    if (!RECIPIENT_KINDS.includes(row.kind) || !row.counterparty) continue;
    const entry = recipients.get(row.counterparty) ?? {
      name: row.counterparty,
      total: 0,
      count: 0,
    };
    entry.total = money(entry.total + Number(row.withdrawn));
    entry.count += 1;
    recipients.set(row.counterparty, entry);
  }

  const times = rows.map((row) => String(row.occurredAt)).sort();
  const moneyIn = sumOf(rows, "paidIn");
  const moneyOut = sumOf(rows, "withdrawn");

  return {
    from: times[0],
    to: times[times.length - 1],
    transactionCount: rows.length,
    moneyIn,
    moneyOut,
    net: money(moneyIn - moneyOut),
    fees: summary("fee"),
    fuliza: summary("fuliza"),
    loans: summary("loan"),
    withdrawals: summary("withdrawal"),
    topRecipients: [...recipients.values()]
      .sort((a, b) => b.total - a.total)
      .slice(0, 5),
  };
};
