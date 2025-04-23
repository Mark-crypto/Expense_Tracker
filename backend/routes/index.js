import { Router } from "express";
import authRouter from "./auth.js";
import profileRouter from "./profile.js";
import budgetRouter from "./budget.js";
import expenseRouter from "./expense.js";
import dashboardRouter from "./dashboard.js";
import predictionsRouter from "./predictions.js";
import { isTokenVerified } from "../middlewares/verifyToken.js";
import { isUserAdmin } from "../middlewares/userRole.js";

const router = Router();

router.use(authRouter);
router.use(profileRouter);
router.use(budgetRouter);
router.use(dashboardRouter);
router.use(predictionsRouter);
router.use(expenseRouter);

export default router;
