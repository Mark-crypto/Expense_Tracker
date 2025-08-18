import { Router } from "express";
import { getReportData, reports } from "../controllers/dashboardController.js";
import { adminDashboard } from "../controllers/adminDashboard.js";
import { isUserAdmin } from "../middlewares/userRole.js";
const router = Router();

router.get("/dashboard/:id", getReportData);
router.get("/dashboard", reports);
router.get("/admin-dashboard", adminDashboard);

export default router;
