import { Router } from "express";
import {
  createExpense,
  deleteExpense,
  getExpenses,
} from "../controllers/expenseController.js";

const router = Router();

router.get("/expenses", getExpenses);
router.post("/expenses", createExpense);
router.put("/expenses", deleteExpense);

export default router;
