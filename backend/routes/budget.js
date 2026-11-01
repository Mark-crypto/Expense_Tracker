import { Router } from "express";
import {
  addBudget,
  deleteBudget,
  getBudget,
  getSingleBudget,
  getBudgetNames,
  getBudgetReport,
} from "../controllers/budgetController.js";

import { validateBudget } from "../middlewares/validate.js";

const router = Router();

router.get("/budget", getBudget);
router.get("/budget/report", getBudgetReport);
router.get("/budget/names", getBudgetNames);
router.get("/budget/:id", getSingleBudget);
router.post("/budget", validateBudget, addBudget);
router.delete("/budget/:id", deleteBudget);

export default router;
