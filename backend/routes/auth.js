import { Router } from "express";
import { logout,me } from "../controllers/authController.js";

const router = Router();

router.post("/auth/logout", logout);
router.post("auth/me", me);

export default router;
 