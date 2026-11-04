// Deciding whether a payment is a tracked bill, when the names don't quite agree:
// a bill called "KPLC" should match "KPLC PREPAID", and "Netflix" should match "NETFLIX.COM".

export const keyOf = (name) => String(name ?? "").trim().toLowerCase();

// Words that say nothing about who was paid.
const FILLER = new Set(["ltd", "limited", "co", "com", "ke", "the", "and", "plc", "inc", "payment", "pay", "acc", "account"]);

const wordsOf = (name) =>
  keyOf(name)
    .split(/[^a-z0-9]+/)
    .filter((word) => word && !FILLER.has(word));

// Every word of the shorter name appears in the longer one, and at least one is a real word.
export const sameName = (a, b) => {
  const first = wordsOf(a);
  const second = wordsOf(b);
  if (first.length === 0 || second.length === 0) return false;
  const [short, long] = first.length <= second.length ? [first, second] : [second, first];
  const words = new Set(long);
  return short.every((word) => words.has(word)) && short.some((word) => word.length >= 3);
};

// The exact name, or one the person has told us is this bill, always counts. A looser name
// match also needs a believable amount for bills with a set price, so "Rent" can't take
// an unrelated payment.
export const exactBill = (bill, name) => keyOf(name) === keyOf(bill.name) || !!bill.aliases?.has(keyOf(name));

export const matchesBill = (bill, name, amount) => {
  if (!name) return false;
  if (exactBill(bill, name)) return true;
  if (!sameName(bill.name, name)) return false;
  if (bill.varies || !amount) return true;
  return amount >= Number(bill.amount) * 0.5 && amount <= Number(bill.amount) * 1.5;
};

// The bill a payment belongs to: an exact or remembered name first, then a looser match.
export const billFor = (bills, name, amount) =>
  bills.find((bill) => exactBill(bill, name)) ?? bills.find((bill) => matchesBill(bill, name, amount)) ?? null;
