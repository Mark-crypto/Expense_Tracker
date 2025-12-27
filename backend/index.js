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
import "./cron/budgetExpiration.js";
import "./cron/deleteExpiredTokens.js";

//look into winston for production logging
//Sanitize inputs with express-validator

const app = express();
const PORT = process.env.PORT || 5050;
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests, please try again later",
});

//middlewares
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use("/api", limiter);

app.post("/api/auth/refresh", refresh);
app.post("/api/auth/login", login);
app.post("/api/auth/signup", signUp);
app.post("/api/auth/forgot-password", forgotPassword);
app.post("/api/auth/reset-password", resetPassword);
app.post("/api/auth/validate-reset-token", validateResetToken);
app.post("/api/auth/logout", logout);

app.use("/api", isTokenVerified, apiRouter);

//server
app.listen(PORT, () => {
  console.log(`Server is listening on PORT ${PORT}`);
});
