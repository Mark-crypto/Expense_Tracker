import { Router } from "express";
import authRouter from "./auth.js";
import profileRouter from "./profile.js";
import budgetRouter from "./budget.js";
import dashboardRouter from "./dashboard.js";
import predictionsRouter from "./predictions.js";

const router = Router();

router.use(authRouter);
router.use(profileRouter);
router.use(budgetRouter);
router.use(dashboardRouter);
router.use(predictionsRouter);

export default router;
