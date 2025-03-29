import { Router } from "express";
import {
  signUp,
  login,
  logout,
  getUser,
} from "../controllers/authController.js";

const router = Router();

router.post("/auth/signup", signUp);
router.post("/auth/login", getUser);
router.get("/auth/login", login);
router.post("/auth/logout", logout);

export default router;
