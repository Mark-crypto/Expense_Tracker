import { maskPhones } from "./maskPhones.js";

// A transaction starts with a 10-character receipt code, then its timestamp.
const TRANSACTION_START =
  /\b([A-Z][A-Z0-9]{9})\s+(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})/g;

const AMOUNT = /-?\s?[\d,]+\.\d{2}/g;

const toNumber = (text) => parseFloat(text.replace(/[^\d.]/g, ""));
const toBalance = (text) => (text.includes("-") ? -toNumber(text) : toNumber(text));

// Columns after the status are paid in, withdrawn, balance. A blank column is
// tolerated by reading the sign: withdrawals are negative.
const readAmounts = (text) => {
  const found = text.match(AMOUNT) ?? [];
  if (found.length >= 3) {
    return {
      paidIn: toNumber(found[0]),
      withdrawn: toNumber(found[1]),
      balance: toBalance(found[2]),
    };
  }
  if (found.length === 2) {
    const isWithdrawal = found[0].includes("-");
    return {
      paidIn: isWithdrawal ? 0 : toNumber(found[0]),
      withdrawn: isWithdrawal ? toNumber(found[0]) : 0,
      balance: toBalance(found[1]),
    };
  }
  return null;
};

const classify = (details, paidIn) => {
  const text = details.toLowerCase();
  if (text.includes("charge")) return "fee";
  if (/overdraft|overdraw|od loan|fuliza/.test(text)) return "fuliza";
  if (/m-shwari|lock savings/.test(text)) return "savings";
  if (/loan|hustler/.test(text)) return "loan";
  if (/airtime|bundles/.test(text)) return "airtime";
  if (paidIn > 0) return "received";
  if (text.includes("pay bill")) return "paybill";
  if (/merchant payment|buy goods/.test(text)) return "till";
  if (/customer transfer|send money/.test(text)) return "send";
  if (text.includes("withdrawal")) return "withdrawal";
  return "other";
};

const counterpartyOf = (details) => {
  const parts = details.split(" - ");
  if (parts.length < 2) return null;
  return parts[parts.length - 1].replace(/\s+Acc\..*$/i, "").trim() || null;
};

const KEYWORD_CATEGORIES = [
  [/kplc|kenya power|water|zuku|faiba|dstv|gotv|safaricom home/, "utilities"],
  [/naivas|quick ?mart|carrefour|chandarana|supermarket|mini ?mart|butchery|restaurant|cafe|java/, "food"],
  [/petrol|fuel|shell|rubis|uber|bolt|little cab/, "transportation"],
  [/pharmacy|chemist|hospital|clinic/, "healthcare"],
  [/school|college|university|academy/, "education"],
  [/netflix|spotify|showmax/, "technology"],
  [/\bkra\b|\bsha\b|nhif/, "taxes"],
];

const KIND_CATEGORIES = {
  airtime: "utilities",
  fuliza: "debt",
  loan: "debt",
  savings: "savings",
};

export const suggestCategory = (kind, details) => {
  const text = details.toLowerCase();
  const match = KEYWORD_CATEGORIES.find(([pattern]) => pattern.test(text));
  return match?.[1] ?? KIND_CATEGORIES[kind] ?? "miscellaneous";
};

export const extractMpesaLines = (text) => {
  const starts = [...text.matchAll(TRANSACTION_START)];
  const rows = [];

  starts.forEach((match, index) => {
    const [header, receiptNo, date, time] = match;
    const end = starts[index + 1]?.index ?? text.length;
    const content = text.slice(match.index + header.length, end);

    const completedIndex = content.indexOf("Completed");
    if (completedIndex === -1) return;

    const amounts = readAmounts(content.slice(completedIndex));
    if (!amounts) return;

    const details = maskPhones(content.slice(0, completedIndex).replace(/\s+/g, " ").trim()).slice(0, 255);
    const kind = classify(details, amounts.paidIn);

    rows.push({
      receiptNo,
      occurredAt: `${date} ${time}`,
      details,
      kind,
      counterparty: counterpartyOf(details),
      ...amounts,
      isSpend: amounts.withdrawn > 0 && kind !== "fee",
      category: suggestCategory(kind, details),
    });
  });

  return rows;
};
