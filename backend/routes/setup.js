import { Router } from "express";
import { getSetup, hideSetup, saveSetup, seeTip } from "../controllers/setupController.js";
import { validateSetup, validateTip } from "../middlewares/validate.js";

const router = Router();

router.get("/setup", getSetup);
router.put("/setup", validateSetup, saveSetup);
router.post("/setup/hide", hideSetup);
router.post("/setup/tips", validateTip, seeTip);

export default router;
