import { Router } from "express";
import {
  createExpense,
  deleteExpense,
  getExpenses,
  getSubcategorySuggestions,
  getAllSubcategoriesForCategory,
  addSubcategorySuggestion,
} from "../controllers/expenseController.js";

const router = Router();

router.get("/expenses", getExpenses);
router.post("/expenses", createExpense);
router.put("/expenses", deleteExpense);

router.get("/subcategory-suggestions", getSubcategorySuggestions);
router.get("/subcategories/:category", getAllSubcategoriesForCategory);
router.post("/subcategories", addSubcategorySuggestion);

export default router;
