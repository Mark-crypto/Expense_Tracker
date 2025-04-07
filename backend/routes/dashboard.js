import { Router } from "express";
import getReportData from "../controllers/dashboardController.js";

const router = Router();

router.get("/dashboard/:id", getReportData);

export default router;
