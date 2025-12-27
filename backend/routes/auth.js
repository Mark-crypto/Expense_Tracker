import { Router } from "express";
import { me } from "../controllers/authController.js";

const router = Router();

router.post("auth/me", me);

export default router;
