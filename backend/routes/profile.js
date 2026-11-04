import { Router } from "express";
import {
  getProfile,
  updateProfile,
  deleteProfile,
} from "../controllers/profileController.js";

import { isProfileOwner } from "../middlewares/userRole.js";
import { validateProfile } from "../middlewares/validate.js";
import { requirePin } from "../utils/security.js";

const router = Router();

router.get("/profile/:id", isProfileOwner, getProfile);
router.put(
  "/profile/:id/edit-form",
  isProfileOwner,
  validateProfile,
  updateProfile
);
router.delete("/profile/:id", isProfileOwner, requirePin, deleteProfile);

export default router;
