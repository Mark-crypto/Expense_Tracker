import { Router } from "express";
import profileRouter from "./profile.js";
import budgetRouter from "./budget.js";
import expenseRouter from "./expense.js";
import dashboardRouter from "./dashboard.js";
import predictionsRouter from "./predictions.js";
import searchRouter from "./search.js";
import notificationRouter from "./notification.js";
import uploadsRouter from "./uploads.js";
import insightsRouter from "./insights.js";
import billsRouter from "./bills.js";
import accountsRouter from "./accounts.js";
import goalsRouter from "./goals.js";
import setupRouter from "./setup.js";
import securityRouter from "./security.js";

const router = Router();

router.use(profileRouter);
router.use(budgetRouter);
router.use(dashboardRouter);
router.use(predictionsRouter);
router.use(expenseRouter);
router.use(searchRouter);
router.use(notificationRouter);
router.use(uploadsRouter);
router.use(insightsRouter);
router.use(billsRouter);
router.use(accountsRouter);
router.use(goalsRouter);
router.use(setupRouter);
router.use(securityRouter);

export default router;
