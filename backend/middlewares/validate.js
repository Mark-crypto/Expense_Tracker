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
  ...subcategories,
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

export const validateTransactions = [
  body("transactions")
    .isArray({ min: 1, max: 10000 })
    .withMessage("No transactions provided"),
  positiveAmount("transactions.*.amount"),
  category("transactions.*.category"),
  pastOrToday("transactions.*.date"),
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
