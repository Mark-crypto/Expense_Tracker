import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import apiRouter from "./routes/index.js";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import {
  forgotPassword,
  login,
  logout,
  refresh,
  resetPassword,
  signUp,
} from "./controllers/authController.js";
import {
  isTokenVerified,
  validateResetToken,
} from "./middlewares/verifyToken.js";

//look into winston for production logging
//Sanitize inputs with express-validator

const FIFTEEN_MINUTES = 15 * 60 * 1000;

const app = express();

// Behind one proxy in production, so rate limits see real client addresses.
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

const limiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  max: 1000,
  message: { error: true, message: "Too many requests, please try again later" },
});

// Only failed logins count, so normal use is never blocked.
const loginLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  max: 10,
  skipSuccessfulRequests: true,
  message: { error: true, message: "Too many attempts. Try again in 15 minutes." },
});

const accountLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  max: 10,
  message: { error: true, message: "Too many attempts. Try again in 15 minutes." },
});

//middlewares
// Statement imports can hold thousands of transactions.
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use("/api", limiter);

app.post("/api/auth/refresh", refresh);
app.post("/api/auth/login", loginLimiter, login);
app.post("/api/auth/signup", accountLimiter, signUp);
app.post("/api/auth/forgot-password", accountLimiter, forgotPassword);
app.post("/api/auth/reset-password", accountLimiter, resetPassword);
app.post("/api/auth/validate-reset-token", validateResetToken);
app.post("/api/auth/logout", logout);

app.use("/api", isTokenVerified, apiRouter);

export default app;
