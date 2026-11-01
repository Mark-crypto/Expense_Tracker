import { Router } from "express";
import {
  createExpense,
  clearExpenses,
  deleteExpense,
  getExpenses,
  getSubcategorySuggestions,
  getAllSubcategoriesForCategory,
  addSubcategorySuggestion,
  getExpenseReport,
} from "../controllers/expenseController.js";

import { validateExpense } from "../middlewares/validate.js";

const router = Router();

router.get("/expenses", getExpenses);
router.get("/expenses/report", getExpenseReport);
router.post("/expenses", validateExpense, createExpense);
router.put("/expenses", clearExpenses);
router.delete("/expenses/:id", deleteExpense);

router.get("/subcategory-suggestions", getSubcategorySuggestions);
router.get("/subcategories/:category", getAllSubcategoriesForCategory);
router.post("/subcategories", addSubcategorySuggestion);

export default router;
