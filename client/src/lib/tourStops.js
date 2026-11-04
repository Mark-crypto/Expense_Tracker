// Every tour's words in one place. Targets are data-tour attributes on the real elements.
const at = (name) => `[data-tour="${name}"]`;
const SEARCH = { fallback: at("search"), fallbackText: "On a phone, find it through Search at the top." };

export const MAIN_TOUR = [
  {
    target: at("safe"),
    title: "Your daily number",
    text: "What you can spend today without touching bills, savings or your safety buffer. It updates as you spend.",
    action: { kind: "pay", label: "Set your pay day", hint: "Makes it last until payday" },
  },
  {
    target: at("add"),
    title: "Add a payment",
    text: "Type it in, paste the M-Pesa SMS, or snap the receipt. We fill in the details.",
  },
  {
    target: at("import"),
    title: "The fastest start",
    text: "Upload your M-Pesa statement and months of spending appear at once, sorted for you.",
    action: { kind: "import", label: "Import now", hint: "Ends the tour" },
  },
  {
    target: at("nav-accounts"),
    ...SEARCH,
    title: "All your money in one place",
    text: "Add M-Pesa, your bank, cash and Sacco. Expenses come off the right one, and your savings goals live here too.",
    action: { kind: "accounts", label: "Add an account", hint: "Takes 30 seconds" },
  },
  {
    target: at("nav-budgets"),
    title: "Budgets that warn you early",
    text: "Set a limit for each category. We warn you as you get close, not after you've gone over.",
    action: { kind: "plan", label: "Plan my month", hint: "Set every limit at once" },
  },
  {
    target: at("nav-bills"),
    ...SEARCH,
    title: "Bills before they're due",
    text: "We spot regular payments like rent, KPLC and subscriptions, and remind you before each one.",
  },
  {
    target: at("nav-xray"),
    fallback: at("xray-link"),
    title: "Where your money really goes",
    text: "Money X-ray shows what came in, what went out, and what fees and Fuliza cost you.",
  },
  {
    target: at("checklist"),
    title: "Start here",
    text: "A few quick things that make the numbers yours. Do them in any order; they tick off as you go.",
    action: { kind: "goal", label: "Set a savings goal", hint: "Know what to put aside" },
  },
];

// Shown the first time each page opens. Stops whose element isn't there are left out.
export const PAGE_TOURS = {
  budgets: [
    { target: at("budget-step"), title: "Change a limit fast", text: "Tap − or + to move it by KES 500. You'll choose whether that's for this month or from now on." },
    { target: at("budget-alerts"), title: "Choose how early we warn you", text: "Pick how many alerts you get, and when. Emails wait until morning." },
    { target: at("budget-plan"), title: "Plan the whole month", text: "Set every limit at once, with suggestions from what you usually spend." },
  ],
  bills: [
    { target: at("bills-suggested"), title: "Found in your statement", text: "These look like repeat payments. Track one and we'll remind you before it's due." },
    { target: at("bills-add"), title: "Add one yourself", text: "Rent, school fees or a subscription we haven't seen yet." },
    { target: at("bills-reminders"), title: "Reminders by email", text: "Get an email a few days before each payment." },
  ],
  xray: [
    { target: at("xray-map"), title: "Follow your money", text: "Money in on the left, where it went on the right. Tap a group to see the payments inside it." },
    { target: at("xray-period"), title: "Pick a month", text: "Compare one month with another, or look at everything at once." },
  ],
  accounts: [
    { target: at("accounts-income"), title: "Money your statement won't show", text: "Record a salary paid into the bank, or cash someone gave you." },
    { target: at("accounts-move"), title: "Moves aren't spending", text: "Moving money between your own accounts keeps both balances right without counting as spending." },
    { target: "#goals", title: "Savings goals", text: "Set an amount and a date, and we'll tell you what to put aside each week." },
  ],
  forecast: [
    { target: at("forecast-range"), title: "This month or the next three", text: "See where this month is heading, or plan ahead." },
    { target: at("forecast-parts"), title: "How it adds up", text: "Spent so far, plus your usual pace, plus the bills still to come." },
  ],
  expenses: [
    { target: at("expenses-search"), title: "Find any payment", text: "Search by who you paid, an item or a note." },
    { target: at("expenses-filter"), title: "Narrow it down", text: "Filter by category, date or amount." },
  ],
};
