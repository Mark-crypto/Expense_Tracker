// Reads one Safaricom M-Pesa confirmation message.
const AMOUNT = "Ksh\\s?([\\d,]+\\.\\d{2})";

const toNumber = (text) => Number(text.replace(/,/g, ""));

const tidyName = (name) => {
  const plain = name
    .replace(/\s*(\+?254|0)\d{9}\s*$/, "")
    .replace(/[.\s]+$/, "")
    .trim();
  return plain === plain.toUpperCase() ? plain.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : plain;
};

const readDate = (text) => {
  const match = text.match(/on (\d{1,2})\/(\d{1,2})\/(\d{2,4})/i);
  if (!match) return null;
  const [, day, month, year] = match;
  const fullYear = year.length === 2 ? `20${year}` : year;
  return `${fullYear}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
};

const KINDS = [
  { kind: "received", pattern: new RegExp(`You have received ${AMOUNT} from (.+?) on \\d`, "i"), name: (m) => tidyName(m[2]) },
  { kind: "withdrawal", pattern: new RegExp(`Withdraw ${AMOUNT} from`, "i"), name: () => "Cash withdrawal" },
  { kind: "airtime", pattern: new RegExp(`bought ${AMOUNT} of airtime`, "i"), name: () => "Airtime" },
  { kind: "till", pattern: new RegExp(`${AMOUNT} paid to (.+?)\\.?\\s+on \\d`, "i"), name: (m) => tidyName(m[2]) },
  {
    kind: "paybill",
    pattern: new RegExp(`${AMOUNT} sent to (.+?) for account (.+?)\\.?\\s+on \\d`, "i"),
    name: (m) => tidyName(m[2]),
    account: (m) => m[3].trim(),
  },
  { kind: "send", pattern: new RegExp(`${AMOUNT} sent to (.+?)\\s+on \\d`, "i"), name: (m) => tidyName(m[2]) },
];

export const parseMpesaSms = (text) => {
  const message = String(text ?? "").replace(/\s+/g, " ").trim();
  const receipt = message.match(/\b([A-Z0-9]{10})\s+confirmed/i);
  if (!receipt) return null;

  for (const { kind, pattern, name, account } of KINDS) {
    const match = message.match(pattern);
    if (!match) continue;
    const balance = message.match(new RegExp(`New M-PESA balance is (-?)${AMOUNT}`, "i"));
    return {
      receiptNo: receipt[1].toUpperCase(),
      kind,
      isSpend: kind !== "received",
      amount: toNumber(match[1]),
      merchant: name(match),
      account: account?.(match) ?? null,
      date: readDate(message),
      balance: balance ? (balance[1] ? -1 : 1) * toNumber(balance[2]) : null,
    };
  }
  return null;
};
