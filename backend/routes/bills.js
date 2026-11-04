import { Router } from "express";
import {
  confirmCapture,
  createBill,
  getBills,
  getCalendar,
  linkCapture,
  markPaid,
  rejectCapture,
  restartBill,
  setReminders,
  skipBill,
  stopBill,
  updateBill,
} from "../controllers/billsController.js";
import {
  validateBill,
  validateBillAmount,
  validateBillLink,
  validateBillStop,
  validateReminders,
} from "../middlewares/validate.js";

const router = Router();

router.get("/bills", getBills);
router.get("/bills/calendar", getCalendar);
router.post("/bills", validateBill, createBill);
router.patch("/bills/reminders", validateReminders, setReminders);
router.post("/bills/captures/:expenseId/confirm", validateBillAmount, confirmCapture);
router.post("/bills/captures/:expenseId/reject", rejectCapture);
router.post("/bills/captures/:expenseId/link", validateBillLink, linkCapture);
router.patch("/bills/:id", validateBill, updateBill);
router.post("/bills/:id/paid", validateBillAmount, markPaid);
router.post("/bills/:id/skip", skipBill);
router.post("/bills/:id/stop", validateBillStop, stopBill);
router.post("/bills/:id/restart", restartBill);

export default router;
