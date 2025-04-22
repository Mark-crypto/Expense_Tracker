import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import apiRouter from "./routes/index.js";
import rateLimit from "express-rate-limit";

const app = express();
const PORT = process.env.PORT || 5000;

//middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "http://localhost:5173",
  })
);
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: "Too many requests, please try again later",
});
app.use("/api", limiter);

app.use("/api", apiRouter);

//server
app.listen(PORT, () => {
  console.log(`Server is listening on PORT ${PORT}`);
});
