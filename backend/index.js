import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import apiRouter from "./routes/index.js";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import { login, refresh, signUp } from "./controllers/authController.js";
import { isTokenVerified } from "./middlewares/verifyToken.js";

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

app.use("/api", isTokenVerified, apiRouter);

//server
app.listen(PORT, () => {
  console.log(`Server is listening on PORT ${PORT}`);
});
