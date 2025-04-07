import { Router } from "express";
import {
  getProfile,
  updateProfile,
  deleteProfile,
} from "../controllers/profileController.js";

const router = Router();

router.get("/profile/:id", getProfile);
router.put("/profile/:id", updateProfile);
router.delete("/profile/:id", deleteProfile);

export default router;
