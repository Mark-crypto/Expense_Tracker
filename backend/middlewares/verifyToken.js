import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export const isTokenVerified = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
      return res.status.json({
        error: true,
        message: "Access denied. Login to access resources.",
      });
    }
    const userInfo = jwt.verify(token, process.env.JWT_SECRET_KEY);
    if (!userInfo) {
      return res.status.json({
        error: true,
        message: "Access denied. Login to access resources.",
      });
    }
    req.userInfo = userInfo;
    next();
  } catch (error) {
    console.log("Error:", error);
    return res.status.json({
      error: true,
      message: "Access denied. Login to access resources.",
    });
  }
};
