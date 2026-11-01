import { Router } from "express";
import {
  getOverview,
  getReportData,
  reports,
} from "../controllers/dashboardController.js";
import { adminDashboard } from "../controllers/adminDashboard.js";
import { isUserAdmin } from "../middlewares/userRole.js";
const router = Router();

router.get("/dashboard/overview", getOverview);
router.get("/dashboard/:id", getReportData);
router.get("/dashboard", reports);
router.get("/admin-dashboard", isUserAdmin, adminDashboard);

export default router;
