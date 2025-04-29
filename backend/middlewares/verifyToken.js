import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export const isTokenVerified = (req, res, next) => {
  try {
    const accessToken = req.cookies.accessToken;
    if (!accessToken) {
      return res.status(401).json({
        error: true,
        message: "Access denied. Login to access resources.",
      });
    }
    const user = jwt.verify(accessToken, process.env.JWT_ACCESS_TOKEN);
    if (!user) {
      return res.status(401).json({
        error: true,
        message: "Access denied. Login to access resources.",
      });
    }
    req.userInfo = user;
    next();
  } catch (error) {
    console.log("Error:", error);
    return res.status(401).json({
      error: true,
      message: "Access denied. Login to access resources.",
    });
  }
};
