import { Router } from "express";
import authRouter from "./auth.js";
import profileRouter from "./profile.js";
import budgetRouter from "./budget.js";
import expenseRouter from "./expense.js";
import dashboardRouter from "./dashboard.js";
import predictionsRouter from "./predictions.js";
import searchRouter from "./search.js";
import notificationRouter from "./notification.js";

const router = Router();

router.use(authRouter);
router.use(profileRouter);
router.use(budgetRouter);
router.use(dashboardRouter);
router.use(predictionsRouter);
router.use(expenseRouter);
router.use(searchRouter);
router.use(notificationRouter);

export default router;
