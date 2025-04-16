import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import apiRouter from "./routes/index.js";
import rateLimit from "express-rate-limit";
import session from "express-session";
import passport from "passport";
import MySQLStore from "express-mysql-session";

const app = express();
const PORT = process.env.PORT || 5000;

//middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: "Too many requests, please try again later",
});
app.use("/api", limiter);

// app.use(
//   session({
//     secret: process.env.SESSION_SECRET,
//     resave: false,
//     saveUninitialized: false,
//     cookie: {
//       maxAge: 1000 * 60 * 60 * 24,
//     },
//   })
// );

app.use("/api", apiRouter);

//server
app.listen(PORT, () => {
  console.log(`Server is listening on PORT ${PORT}`);
});
