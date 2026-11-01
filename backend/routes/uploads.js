import { Router } from "express";
import {
  createMpesaExpense,
  createReceiptExpense,
  saveMpesaTransactions,
  saveReceiptExpense,
} from "../controllers/uploadsController.js";
import multer from "multer";
import {
  validateReceiptExpense,
  validateTransactions,
} from "../middlewares/validate.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.post(
  "/upload/mpesa",
  upload.single("mpesaStatement"),
  createMpesaExpense
);
router.post("/mpesa/save", validateTransactions, saveMpesaTransactions);
router.post(
  "/upload/receipt",
  upload.single("receiptImage"),
  createReceiptExpense
);
router.post("/expenses/save", validateReceiptExpense, saveReceiptExpense);

export default router;
