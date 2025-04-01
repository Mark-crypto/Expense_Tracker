import { Router } from "express";
import GetBarChartData from "../controllers/barChartController";
import Piechart from "../controllers/pieChartController";
import Debt from "../controllers/debtController";

const router = Router();

router.get("/dashboard/:id", Debt);

export default router;
