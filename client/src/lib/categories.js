export const EXPENSE_CATEGORIES = [
  { value: "housing", label: "Housing" },
  { value: "utilities", label: "Utilities" },
  { value: "transportation", label: "Transportation" },
  { value: "food", label: "Food & Groceries" },
  { value: "healthcare", label: "Healthcare" },
  { value: "insurance", label: "Insurance" },
  { value: "debt", label: "Debt & Loans" },
  { value: "education", label: "Education" },
  { value: "savings", label: "Savings & Investments" },
  { value: "personalCare", label: "Personal Care" },
  { value: "clothing", label: "Clothing & Accessories" },
  { value: "entertainment", label: "Entertainment & Leisure" },
  { value: "gifts", label: "Gifts & Donations" },
  { value: "householdSupplies", label: "Household Supplies" },
  { value: "family", label: "Childcare & Family" },
  { value: "pets", label: "Pets & Pet Care" },
  { value: "work", label: "Work & Business" },
  { value: "technology", label: "Technology & Subscriptions" },
  { value: "travel", label: "Travel & Vacations" },
  { value: "emergency", label: "Emergency / Unexpected" },
  { value: "taxes", label: "Taxes & Fees" },
  { value: "retirement", label: "Retirement" },
  { value: "miscellaneous", label: "Miscellaneous / Other" },
];

const labels = Object.fromEntries(
  EXPENSE_CATEGORIES.map(({ value, label }) => [value, label])
);

export const categoryLabel = (value) => labels[value] ?? value ?? "Uncategorized";
