import { Router } from "express";
import {
  createMpesaExpense,
  createReceiptExpense,
  saveMpesaTransactions,
  saveReceiptExpense,
} from "../controllers/uploadsController.js";
import multer from "multer";

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
router.post("mpesa/save", saveMpesaTransactions);
router.post(
  "/upload/receipt",
  upload.single("receiptImage"),
  createReceiptExpense
);
router.post("/expenses/save", saveReceiptExpense);

export default router;
