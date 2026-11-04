// Page names for breadcrumbs that point back to wherever someone came from.
const LABELS = [
  ["/expenses/new", "Add expense"],
  ["/dashboard", "Dashboard"],
  ["/history", "Expenses"],
  ["/budget", "Budgets"],
  ["/predictions", "Forecast"],
  ["/bills", "Bills & Subscriptions"],
  ["/accounts", "Accounts"],
  ["/insights", "Money X-ray"],
  ["/security", "Privacy & security"],
  ["/help", "Help"],
];

export const pageLabel = (path) => LABELS.find(([prefix]) => path?.startsWith(prefix))?.[1] ?? "Dashboard";

// Where to go back to: the page passed in navigation state, or the Dashboard.
export const backTo = (from, fallback = "/dashboard") => ({ to: from || fallback, label: pageLabel(from || fallback) });
