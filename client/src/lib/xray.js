import { categoryColor } from "@/components/ui/category";
import { EXPENSE_CATEGORIES, categoryLabel } from "@/lib/categories";

// Groups that aren't expense categories: statement-only money movements.
const SPECIAL = {
  people: ["Sent to people", "var(--cat-4)"],
  fees: ["M-Pesa fees", "var(--cat-1)"],
  fuliza: ["Fuliza repaid", "var(--cat-1)"],
  loans: ["Loans repaid", "var(--cat-1)"],
  cash: ["Cash withdrawn", "var(--cat-6)"],
  moves: ["Moved to your accounts", "var(--muted-foreground)"],
  rest: ["Everything else", "var(--muted-foreground)"],
  left: ["Left over", "var(--chart-in)"],
  balance: ["From your balance", "var(--muted-foreground)"],
};

const SOURCES = {
  business: "Salary and business",
  people: "From people",
  fuliza: "Fuliza borrowed",
  loans: "Loans received",
  savings: "From savings",
  deposits: "Deposits",
  moves: "From your accounts",
  other: "Other money in",
};

export const groupLabel = (key) => SPECIAL[key]?.[0] ?? categoryLabel(key);
export const groupColor = (key) => SPECIAL[key]?.[1] ?? categoryColor(key);
export const sourceLabel = (key) => SOURCES[key] ?? SOURCES.other;
export const isExpenseCategory = (key) => EXPENSE_CATEGORIES.some((row) => row.value === key);

// Findings name categories as {{key}} so they read in the user's own labels.
export const fillLabels = (text) => text.replace(/\{\{(\w+)\}\}/g, (_, key) => groupLabel(key));
