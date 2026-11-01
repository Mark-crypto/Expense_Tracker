import { Router } from "express";
import { getXray } from "../controllers/insightsController.js";

const router = Router();

router.get("/insights/xray", getXray);

export default router;
