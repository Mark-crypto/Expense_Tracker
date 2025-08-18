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
    const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_TOKEN);
    if (!decoded) {
      return res.status(401).json({
        error: true,
        message: "Access denied. Login to access resources.",
      });
    }
     req.user = {
      userId: decoded.userId,
      name: decoded.name,
      role: decoded.role,
    };
    next();
  } catch (error) {
    console.log("Error:", error);
    return res.status(401).json({
      error: true,
      message: "Access denied. Login to access resources.",
    });
  }
};
