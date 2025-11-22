import { Router } from "express";
import {
  createMpesaExpense,
  createReceiptExpense,
} from "../controllers/uploadsController.js";

const router = Router();

router.post("/upload/mpesa", createMpesaExpense);
router.post("/upload/receipt", createReceiptExpense);

export default router;
