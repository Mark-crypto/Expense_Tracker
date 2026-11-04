const MONEY_QUERIES = [
  "expense",
  "dashboard-overview",
  "budgets",
  "limit-notification",
  "merchant-history",
  "forecast",
  "xray",
  "quick-add",
  "bills",
  "accounts",
  "goals",
  "setup",
  "pay-settings",
];

// Every page that shows money, so a change appears everywhere at once.
export const refreshMoneyData = (queryClient) =>
  MONEY_QUERIES.forEach((queryKey) => queryClient.invalidateQueries({ queryKey: [queryKey] }));
