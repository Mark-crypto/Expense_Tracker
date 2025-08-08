import { Router } from "express";
import { logout } from "../controllers/authController.js";

const router = Router();

router.post("/auth/logout", logout);

export default router;
 