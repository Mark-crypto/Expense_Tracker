export const FREQUENCIES = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "termly", label: "Termly" },
  { value: "yearly", label: "Yearly" },
];

export const STOP_REASONS = [
  { value: "cancelled", label: "Cancelled" },
  { value: "too_expensive", label: "Too expensive" },
  { value: "moved", label: "Moved" },
  { value: "not_regular", label: "Not a regular payment" },
  { value: "other", label: "Other" },
];

export const frequencyLabel = (value) => FREQUENCIES.find((row) => row.value === value)?.label ?? value;
export const reasonLabel = (value) => STOP_REASONS.find((row) => row.value === value)?.label;

export const KINDS = [
  { value: "bill", label: "Bill", plural: "Bills", hint: "A need, like KPLC or rent" },
  { value: "subscription", label: "Subscription", plural: "Subscriptions", hint: "A choice, like Spotify" },
];

const SUBSCRIPTION_CATEGORIES = ["entertainment", "technology"];
export const guessKind = (category) => (SUBSCRIPTION_CATEGORIES.includes(category) ? "subscription" : "bill");
export const kindLabel = (value) => KINDS.find((row) => row.value === value)?.label ?? value;
