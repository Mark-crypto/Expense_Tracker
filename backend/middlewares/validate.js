import { body, validationResult } from "express-validator";

const MAX_AMOUNT = 1_000_000_000;
const ALERT_MODES = ["important", "balanced", "everything", "off"];
const ONE_DAY = 24 * 60 * 60 * 1000;

const handleErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: true, message: errors.array()[0].msg });
  }
  next();
};

const positiveAmount = (field) =>
  body(field)
    .isFloat({ gt: 0, max: MAX_AMOUNT })
    .withMessage("Enter an amount greater than 0");

const category = (field = "category") =>
  body(field)
    .isString()
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage("Choose a valid category");

// One day of tolerance so users ahead of the server's timezone can log today.
const pastOrToday = (field) =>
  body(field).custom((value) => {
    const time = new Date(value).getTime();
    if (Number.isNaN(time)) throw new Error("Enter a valid date");
    if (time > Date.now() + ONE_DAY) {
      throw new Error("Expense dates can't be in the future");
    }
    return true;
  });

const subcategories = [
  body("subcategories")
    .isArray({ min: 1 })
    .withMessage("Add at least one item"),
  body("subcategories.*.name")
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Each item needs a name"),
  positiveAmount("subcategories.*.amount"),
];

const accountId = (field = "accountId") =>
  body(field).optional({ values: "null" }).isInt({ min: 1 }).withMessage("Choose a valid account");

const requiredAccount = (field) => body(field).isInt({ min: 1 }).withMessage("Choose an account");

const validDate = (field) =>
  body(field)
    .optional({ values: "null" })
    .custom((value) => {
      if (Number.isNaN(new Date(value).getTime())) {
        throw new Error("Enter a valid date");
      }
      return true;
    });

export const validateExpense = [
  positiveAmount("amount"),
  body("receiptNo").optional({ values: "null" }).matches(/^[A-Z0-9]{10}$/).withMessage("Invalid receipt number"),
  body("budgetId").optional({ values: "null" }).isInt({ min: 1 }).withMessage("Choose a valid budget"),
  category(),
  pastOrToday("date"),
  body("merchant")
    .optional({ values: "null" })
    .isString()
    .isLength({ max: 150 })
    .withMessage("Use 150 characters or fewer"),
  accountId(),
  ...subcategories,
  handleErrors,
];

export const validateExpenseEdit = [
  positiveAmount("amount"),
  category(),
  pastOrToday("date"),
  body("merchant")
    .optional({ values: "null" })
    .isString()
    .isLength({ max: 150 })
    .withMessage("Use 150 characters or fewer"),
  body("note")
    .optional({ values: "null" })
    .isString()
    .isLength({ max: 500 })
    .withMessage("Keep the note under 500 characters"),
  body("budgetId")
    .optional({ values: "null" })
    .isInt({ min: 1 })
    .withMessage("Choose a valid budget"),
  accountId(),
  handleErrors,
];

export const validateBulk = [
  body("ids").isArray({ min: 1, max: 500 }).withMessage("Select at least one expense"),
  body("ids.*").isInt({ min: 1 }).withMessage("Invalid selection"),
  body("action")
    .isIn(["category", "budget", "confirm", "delete", "restore"])
    .withMessage("Unknown action"),
  body("category")
    .if(body("action").equals("category"))
    .isString()
    .isLength({ min: 1, max: 20 })
    .withMessage("Choose a valid category"),
  body("budgetId")
    .optional({ values: "null" })
    .isInt({ min: 1 })
    .withMessage("Choose a valid budget"),
  handleErrors,
];

export const validateApplyMerchant = [
  body("merchant")
    .isString()
    .isLength({ min: 1, max: 150 })
    .withMessage("Choose a valid merchant"),
  category(),
  handleErrors,
];

const budgetDetails = [
  body("name")
    .isString()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Enter a budget name of up to 50 characters"),
  category(),
  body("period").optional().isIn(["monthly", "weekly", "once"]).withMessage("Choose how often this budget runs"),
  body("rollover").optional().isBoolean().withMessage("Invalid value"),
  body("alertMode").optional({ values: "null" }).isIn(ALERT_MODES).withMessage("Choose an alert setting"),
  body("warnAt").optional({ values: "null" }).isInt({ min: 1, max: 100 }).withMessage("Enter a percentage from 1 to 100"),
  body("subcategories").optional().isArray().withMessage("Invalid items"),
  body("subcategories.*.name").isString().trim().isLength({ min: 1, max: 100 }).withMessage("Each item needs a name"),
  positiveAmount("subcategories.*.amount"),
  body("startDate").if(body("period").equals("once")).notEmpty().withMessage("Choose a start date"),
  body("endDate").if(body("period").equals("once")).notEmpty().withMessage("Choose an end date"),
  validDate("startDate"),
  validDate("endDate"),
  body("endDate").custom((value, { req }) => {
    if (value && req.body.startDate && new Date(value) < new Date(req.body.startDate)) {
      throw new Error("The end date can't be before the start date");
    }
    return true;
  }),
];

export const validateBudget = [...budgetDetails, positiveAmount("amount"), handleErrors];
export const validateBudgetEdit = [...budgetDetails, handleErrors];

export const validateMoveBudget = [
  requiredAccount("fromId"),
  requiredAccount("toId"),
  positiveAmount("amount"),
  handleErrors,
];

export const validatePlan = [
  body("rows").isArray({ min: 1, max: 40 }).withMessage("Nothing to save"),
  category("rows.*.category"),
  body("rows.*.name").isString().trim().isLength({ min: 1, max: 50 }).withMessage("Invalid name"),
  positiveAmount("rows.*.amount"),
  handleErrors,
];

export const validateAlertSettings = [
  body("mode").isIn(ALERT_MODES).withMessage("Choose an alert setting"),
  body("warnAt").isInt({ min: 1, max: 100 }).withMessage("Enter a percentage from 1 to 100"),
  body("emails").isBoolean().withMessage("Invalid value"),
  handleErrors,
];

export const validateBillKey = [
  body("key")
    .isString()
    .isLength({ min: 1, max: 150 })
    .withMessage("Choose a valid bill"),
  handleErrors,
];

export const validateLimit = [
  positiveAmount("amount"),
  body("scope").optional().isIn(["month", "forward"]).withMessage("Choose when this applies"),
  handleErrors,
];

export const validateTransactions = [
  body("transactions")
    .isArray({ min: 1, max: 10000 })
    .withMessage("No transactions provided"),
  body("transactions.*.receiptNo")
    .matches(/^[A-Z0-9]{10}$/)
    .withMessage("Invalid receipt number"),
  pastOrToday("transactions.*.occurredAt"),
  body("transactions.*.details")
    .isString()
    .isLength({ min: 1, max: 255 })
    .withMessage("Invalid transaction details"),
  body("transactions.*.kind")
    .isString()
    .isLength({ min: 1, max: 20 })
    .withMessage("Invalid transaction type"),
  body("transactions.*.counterparty")
    .optional({ values: "null" })
    .isString()
    .isLength({ max: 150 })
    .withMessage("Invalid recipient"),
  body("transactions.*.paidIn")
    .isFloat({ min: 0, max: MAX_AMOUNT })
    .withMessage("Invalid amount"),
  body("transactions.*.withdrawn")
    .isFloat({ min: 0, max: MAX_AMOUNT })
    .withMessage("Invalid amount"),
  category("transactions.*.category"),
  handleErrors,
];

export const validateReceiptExpense = [
  positiveAmount("amount"),
  body("budgetId").optional({ values: "null" }).isInt({ min: 1 }).withMessage("Choose a valid budget"),
  category(),
  pastOrToday("date"),
  accountId(),
  body("description")
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Enter a description"),
  handleErrors,
];

const BILL_FREQUENCIES = ["weekly", "monthly", "termly", "yearly"];
const STOP_REASONS = ["cancelled", "too_expensive", "moved", "not_regular", "other"];

export const validateBill = [
  body("name")
    .isString()
    .trim()
    .isLength({ min: 1, max: 150 })
    .withMessage("Enter a name"),
  category(),
  positiveAmount("amount"),
  body("frequency").isIn(BILL_FREQUENCIES).withMessage("Choose how often this is paid"),
  body("nextDue").isISO8601({ strict: true }).withMessage("Enter a valid date"),
  body("varies").optional().isBoolean().withMessage("Invalid value"),
  body("kind").optional().isIn(["bill", "subscription"]).withMessage("Choose bill or subscription"),
  accountId(),
  handleErrors,
];

export const validateBillLink = [
  body("paymentId").isInt({ min: 1 }).withMessage("Choose the payment"),
  handleErrors,
];

export const validateBillAmount = [
  body("amount")
    .optional({ values: "null" })
    .isFloat({ gt: 0, max: MAX_AMOUNT })
    .withMessage("Enter an amount greater than 0"),
  handleErrors,
];

export const validateBillStop = [
  body("reason").optional({ values: "null" }).isIn(STOP_REASONS).withMessage("Choose a valid reason"),
  body("note")
    .optional({ values: "null" })
    .isString()
    .isLength({ max: 255 })
    .withMessage("Keep the note under 255 characters"),
  handleErrors,
];

export const validateReminders = [
  body("enabled").isBoolean().withMessage("Invalid value"),
  handleErrors,
];

const accountName = body("name")
  .isString()
  .trim()
  .isLength({ min: 1, max: 60 })
  .withMessage("Enter an account name");

const anyBalance = body("balance")
  .isFloat({ min: -MAX_AMOUNT, max: MAX_AMOUNT })
  .withMessage("Enter a balance");

export const validateAccount = [
  accountName,
  body("type").isIn(["mpesa", "bank", "cash", "savings", "other"]).withMessage("Choose an account type"),
  anyBalance,
  body("spendable").optional().isBoolean().withMessage("Invalid value"),
  handleErrors,
];

export const validateAccountEdit = [
  accountName,
  body("spendable").isBoolean().withMessage("Invalid value"),
  handleErrors,
];

export const validateBalance = [anyBalance, handleErrors];

export const validateIncome = [
  requiredAccount("accountId"),
  positiveAmount("amount"),
  body("name").isString().trim().isLength({ min: 1, max: 150 }).withMessage("Where did it come from?"),
  pastOrToday("date"),
  handleErrors,
];

export const validateTransfer = [
  requiredAccount("fromId"),
  requiredAccount("toId"),
  positiveAmount("amount"),
  pastOrToday("date"),
  handleErrors,
];

export const validateQuestion = [accountId(), handleErrors];

const goalFields = [
  body("name").isString().trim().isLength({ min: 1, max: 60 }).withMessage("Give the goal a name"),
  positiveAmount("target"),
  body("dueDate")
    .optional({ values: "falsy" })
    .custom((value) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(new Date(value).getTime())) {
        throw new Error("Enter a valid date");
      }
      if (value <= new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Nairobi" })) {
        throw new Error("Pick a date after today");
      }
      return true;
    }),
  accountId(),
];

export const validateGoal = [
  ...goalFields,
  body("saved").optional({ values: "null" }).isFloat({ min: 0, max: MAX_AMOUNT }).withMessage("Enter 0 or more"),
  handleErrors,
];

export const validateGoalEdit = [...goalFields, handleErrors];

const pinField = body("pin").isString().matches(/^\d{4}$/).withMessage("Enter 4 digits");

export const validatePin = [pinField, handleErrors];

export const validatePinReset = [
  body("password").isString().isLength({ min: 1, max: 200 }).withMessage("Enter your password"),
  pinField,
  handleErrors,
];

export const validatePasswordChange = [
  body("current").isString().isLength({ min: 1, max: 200 }).withMessage("Enter your current password"),
  body("next").isString().isLength({ min: 8, max: 200 }).withMessage("Use at least 8 characters"),
  body("next")
    .custom((value, { req }) => value !== req.body.current)
    .withMessage("Choose a password you haven't just used"),
  handleErrors,
];

export const validateStatementDelete = [
  body("keepExpenses").isBoolean({ strict: true }).withMessage("Choose whether to keep your expenses"),
  handleErrors,
];

export const validateSetup = [
  body("step").optional({ values: "null" }).isInt({ min: 0, max: 7 }).withMessage("Invalid step"),
  body("status").optional({ values: "null" }).isIn(["done"]).withMessage("Invalid status"),
  handleErrors,
];

export const validateTip = [
  body("tip").isIn(["budgets", "bills", "xray", "accounts", "forecast", "expenses", "allset", "pinprompt"]).withMessage("Unknown tip"),
  handleErrors,
];

export const validateGoalMoney = [
  positiveAmount("amount"),
  body("direction").isIn(["add", "take"]).withMessage("Choose add or take out"),
  handleErrors,
];

export const validatePaySettings = [
  body("payType").isIn(["salary", "irregular"]).withMessage("Choose how you get paid"),
  body("payDay")
    .if(body("payType").equals("salary"))
    .isInt({ min: 1, max: 31 })
    .withMessage("Enter a pay day from 1 to 31"),
  body("buffer").isFloat({ min: 0, max: MAX_AMOUNT }).withMessage("Enter a buffer of 0 or more"),
  handleErrors,
];

export const validateSms = [
  body("text").isString().isLength({ min: 1, max: 2000 }).withMessage("Paste an M-Pesa message"),
  handleErrors,
];

export const validateShortcut = [
  body("merchant").isString().trim().isLength({ min: 1, max: 150 }).withMessage("Enter a name"),
  category(),
  accountId(),
  handleErrors,
];

export const validateProfile = [
  body("name")
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Enter a valid name"),
  body("age").isInt({ min: 1, max: 120 }).withMessage("Enter a valid age"),
  body("occupation")
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Enter a valid occupation"),
  body("goal")
    .isString()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage("Enter a valid goal"),
  handleErrors,
];
