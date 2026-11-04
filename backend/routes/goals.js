import { Router } from "express";
import {
  archiveGoal,
  createGoal,
  deleteGoal,
  getGoals,
  moveGoalMoney,
  updateGoal,
} from "../controllers/goalsController.js";
import { validateGoal, validateGoalEdit, validateGoalMoney } from "../middlewares/validate.js";

const router = Router();

router.get("/goals", getGoals);
router.post("/goals", validateGoal, createGoal);
router.patch("/goals/:id", validateGoalEdit, updateGoal);
router.delete("/goals/:id", deleteGoal);
router.post("/goals/:id/money", validateGoalMoney, moveGoalMoney);
router.post("/goals/:id/archive", archiveGoal);

export default router;
