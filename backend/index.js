import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import apiRouter from "./routes/index.js";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import { login, refresh, signUp } from "./controllers/authController.js";

const app = express();
const PORT = process.env.PORT || 5050;

//middlewares
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests, please try again later",
});
app.post("/auth/refresh", refresh);
app.post("/auth/login", login);
app.post("/auth/signup", signUp);

app.use("/api", limiter);
app.use("/api", apiRouter);

//server
app.listen(PORT, () => {
  console.log(`Server is listening on PORT ${PORT}`);
});
