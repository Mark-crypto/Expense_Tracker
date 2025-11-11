import { Router } from "express";
import { getNotifications } from "../controllers/notificationController.js";

const router = Router();

router.get("/notifications", getNotifications);

export default router;
