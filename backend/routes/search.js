import { Router } from "express";
import {
  expenseSearch,
  budgetSearch,
} from "../controllers/searchController.js";

const router = Router();

router.get("/expense/search", expenseSearch);
router.get("/budgets/search", budgetSearch);

export default router;
