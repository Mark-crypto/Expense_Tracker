import { Router } from "express";
import {
  addBudget,
  getPlan,
  moveBudgetMoney,
  saveAlertSettings,
  savePlan,
  updateBudget,
  getBudgetOverview,
  suggestBudget,
  updateBudgetStatus,
  updateBudgetLimit,
  deleteBudget,
  getBudget,
  getSingleBudget,
  getBudgetNames,
  getBudgetReport,
} from "../controllers/budgetController.js";

import {
  validateAlertSettings,
  validateBudget,
  validateBudgetEdit,
  validateLimit,
  validateMoveBudget,
  validatePlan,
} from "../middlewares/validate.js";

const router = Router();

router.get("/budgets/overview", getBudgetOverview);
router.get("/budgets/suggest", suggestBudget);
router.get("/budgets/plan", getPlan);
router.post("/budgets/plan", validatePlan, savePlan);
router.post("/budgets/move", validateMoveBudget, moveBudgetMoney);
router.put("/budgets/alert-settings", validateAlertSettings, saveAlertSettings);
router.get("/budget", getBudget);
router.get("/budget/report", getBudgetReport);
router.get("/budget/names", getBudgetNames);
router.get("/budget/:id", getSingleBudget);
router.post("/budget", validateBudget, addBudget);
router.patch("/budget/:id", validateBudgetEdit, updateBudget);
router.patch("/budget/:id/limit", validateLimit, updateBudgetLimit);
router.patch("/budget/:id/status", updateBudgetStatus);
router.delete("/budget/:id", deleteBudget);

export default router;
