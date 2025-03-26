import { Router } from "express";
import { getReports } from "../controllers/dashboard.js";

const router = Router();

router.get("/dashboard/:id", getReports);

export default router;
