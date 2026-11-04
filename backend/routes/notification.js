import { Router } from "express";
import {
  getNotifications,
  markNotificationAsRead,
} from "../controllers/notificationController.js";

const router = Router();

router.get("/notifications", getNotifications);
router.patch(
  "/notifications/mark-as-read/:notificationId",
  markNotificationAsRead
);
export default router;
