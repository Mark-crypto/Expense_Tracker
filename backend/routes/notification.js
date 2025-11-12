import { Router } from "express";
import {
  getNotifications,
  markNotificationAsRead,
  implementNotificationAction,
} from "../controllers/notificationController.js";

const router = Router();

router.get("/notifications", getNotifications);
router.patch(
  "/notifications/mark-as-read/:notificationId",
  markNotificationAsRead
);
router.post(
  "/notifications/action/:notificationId",
  implementNotificationAction
);

export default router;
