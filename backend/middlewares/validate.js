import { body, validationResult } from "express-validator";

const MAX_AMOUNT = 1_000_000_000;
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
  category(),
  pastOrToday("date"),
  body("merchant")
    .optional({ values: "null" })
    .isString()
    .isLength({ max: 150 })
    .withMessage("Use 150 characters or fewer"),
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

export const validateBudget = [
  body("name")
    .isString()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Enter a budget name of up to 50 characters"),
  category(),
  positiveAmount("amount"),
  ...subcategories,
  validDate("startDate"),
  validDate("endDate"),
  body("endDate").custom((value, { req }) => {
    if (value && req.body.startDate && new Date(value) < new Date(req.body.startDate)) {
      throw new Error("The end date can't be before the start date");
    }
    return true;
  }),
  handleErrors,
];

export const validateBillKey = [
  body("key")
    .isString()
    .isLength({ min: 1, max: 150 })
    .withMessage("Choose a valid bill"),
  handleErrors,
];

export const validateLimit = [positiveAmount("amount"), handleErrors];

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
  category(),
  pastOrToday("date"),
  body("description")
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Enter a description"),
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
