import { Router } from "express";
import { getPredictions } from "../controllers/predictionsController.js";

const router = Router();

router.get("/predictions", getPredictions);
export default router;
