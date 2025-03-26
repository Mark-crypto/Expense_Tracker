import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import apiRouter from "./routes/index.js";
import session from "express-session";
import passport from "passport";
import MySQLStore from "express-mysql-session";

const app = express();
const PORT = 5000 | process.env.PORT;

//middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
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
