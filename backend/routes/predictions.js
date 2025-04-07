import { Router } from "express";
import { getPredictions } from "../controllers/predictionsController.js";

const router = Router();

router.get("/predictions/:id", getPredictions);
export default router;
