import { Router } from "express";
import {
  dismissBill,
  getForecast,
  restoreBill,
} from "../controllers/predictionsController.js";
import { validateBillKey } from "../middlewares/validate.js";

const router = Router();

router.get("/forecast", getForecast);
router.post("/forecast/bills/dismiss", validateBillKey, dismissBill);
router.post("/forecast/bills/restore", validateBillKey, restoreBill);

export default router;
