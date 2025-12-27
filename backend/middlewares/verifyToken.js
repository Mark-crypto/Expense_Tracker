import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import crypto from "crypto";
import connection from "../database.js";
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
      email: decoded.email,
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

export const validateResetToken = async (req, res) => {
  const { token } = req.query;

  try {
    if (!token) {
      return res.status(400).json({
        valid: false,
        message: "No token provided",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      return res.status(200).json({
        valid: false,
        message: "Invalid or expired token",
      });
    }

    const { userId, resetToken } = decoded;

    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const [users] = await connection.execute(
      "SELECT user_id FROM users WHERE user_id = ? AND reset_password_token = ? AND reset_password_expires > NOW()",
      [userId, hashedToken]
    );

    if (users.length === 0) {
      return res.status(200).json({
        valid: false,
        message: "Invalid or expired token",
      });
    }

    return res.status(200).json({
      valid: true,
      message: "Token is valid",
    });
  } catch (error) {
    console.error("Token validation error:", error);
    return res.status(200).json({
      valid: false,
      message: "Invalid token",
    });
  }
};
