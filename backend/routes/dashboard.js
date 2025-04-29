import { Router } from "express";
import { getReportData, reports } from "../controllers/dashboardController.js";

const router = Router();

router.get("/dashboard/:id", getReportData);
router.get("/dashboard", reports);

export default router;
