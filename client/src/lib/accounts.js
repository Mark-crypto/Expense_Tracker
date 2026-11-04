import { formatKES } from "@/lib/format";
import { balancesHidden, MASK } from "@/lib/privacy";

export const ACCOUNT_TYPES = [
  { value: "mpesa", label: "M-Pesa", name: "M-Pesa", color: "var(--cat-2)" },
  { value: "bank", label: "Bank", name: "Bank", color: "var(--cat-5)" },
  { value: "cash", label: "Cash", name: "Cash", color: "var(--cat-6)" },
  { value: "savings", label: "Savings", name: "Savings", color: "var(--cat-1)" },
  { value: "other", label: "Other", name: "", color: "var(--cat-3)" },
];

export const accountColor = (type) => ACCOUNT_TYPES.find((row) => row.value === type)?.color;

export const signedKES = (value) => (value < 0 && !balancesHidden() ? `−${formatKES(-value)}` : formatKES(value));

export const signedChange = (value) => {
  if (value === 0) return "0";
  if (balancesHidden()) return MASK;
  return `${value > 0 ? "+" : "−"}${Math.abs(value).toLocaleString("en-KE")}`;
};

export const dayMonth = (date) =>
  new Date(`${date}T00:00`).toLocaleDateString("en-KE", { day: "numeric", month: "short" });

export const monthName = (month) =>
  new Date(`${month}-01T00:00`).toLocaleDateString("en-KE", { month: "long", year: "numeric" });

export const balanceNote = ({ type, balance, updatedOn, updatedFrom }) => {
  if (type === "mpesa" && balance < 0) return "You owe this on Fuliza";
  if (!updatedOn) return "No balance yet";
  return `${updatedFrom === "statement" ? "From your statement" : "Updated by you"}, ${dayMonth(updatedOn)}`;
};
