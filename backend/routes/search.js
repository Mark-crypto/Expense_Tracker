import { Router } from "express";
import {
  expenseSearch,
  budgetSearch,
} from "../controllers/searchController.js";

const router = Router();

router.get("/search", expenseSearch);
router.get("/search2", budgetSearch);

export default router;
