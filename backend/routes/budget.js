import { Router } from "express";
import {
  addBudget,
  deleteBudget,
  getBudget,
  getSingleBudget,
} from "../controllers/budgetController.js";

const router = Router();

router.get("/budget", getBudget);
router.get("/budget/:id", getSingleBudget);
router.post("/budget", addBudget);
router.delete("/budget/:id", deleteBudget);

export default router;
