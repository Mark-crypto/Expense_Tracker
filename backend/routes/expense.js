import { Router } from "express";
import {
  createExpense,
  parseSms,
  deleteShortcut,
  saveShortcut,
  applyMerchantCategory,
  bulkUpdateExpenses,
  clearExpenses,
  getMerchantHistory,
  getQuickAdd,
  updateExpense,
  deleteExpense,
  getExpenses,
  getSubcategorySuggestions,
  getAllSubcategoriesForCategory,
  addSubcategorySuggestion,
  getExpenseReport,
} from "../controllers/expenseController.js";

import {
  validateApplyMerchant,
  validateBulk,
  validateExpense,
  validateExpenseEdit,
  validateShortcut,
  validateSms,
} from "../middlewares/validate.js";

const router = Router();

router.get("/expenses", getExpenses);
router.get("/expenses/report", getExpenseReport);
router.get("/expenses/merchant", getMerchantHistory);
router.get("/expenses/quick-add", getQuickAdd);
router.post("/expenses/parse-sms", validateSms, parseSms);
router.post("/expenses/shortcuts", validateShortcut, saveShortcut);
router.delete("/expenses/shortcuts/:id", deleteShortcut);
router.post("/expenses/bulk", validateBulk, bulkUpdateExpenses);
router.post("/expenses/apply-merchant", validateApplyMerchant, applyMerchantCategory);
router.patch("/expenses/:id", validateExpenseEdit, updateExpense);
router.post("/expenses", validateExpense, createExpense);
router.put("/expenses", clearExpenses);
router.delete("/expenses/:id", deleteExpense);

router.get("/subcategory-suggestions", getSubcategorySuggestions);
router.get("/subcategories/:category", getAllSubcategoriesForCategory);
router.post("/subcategories", addSubcategorySuggestion);

export default router;
