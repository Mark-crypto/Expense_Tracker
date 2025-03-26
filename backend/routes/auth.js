import { Router } from "express";
import { signUp, login, logout } from "../controllers/authController.js";

const router = Router();

router.post("/auth/signup", signUp);
router.post("/auth/login", login);
router.post("/auth/logout", logout);

export default router;
