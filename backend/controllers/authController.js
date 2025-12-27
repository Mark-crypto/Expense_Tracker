import connection from "../database.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import crypto from "crypto";
import { sendPasswordChangedEmail } from "../utils/emailAlert.js";

dotenv.config();

export const me = (req, res) => {
  try {
    const accessToken = req.cookies.accessToken;

    if (!accessToken) {
      return res.status(401).json({
        error: true,
        message: "Not authenticated",
      });
    }

    try {
      const user = jwt.verify(accessToken, process.env.JWT_ACCESS_TOKEN);
      res.json({
        error: false,
        user: {
          userId: user.userId,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          error: true,
          message: "Access token expired. Please refresh.",
        });
      }
      return res.status(401).json({
        error: true,
        message: "Invalid token",
      });
    }
  } catch (err) {
    console.error("Auth error:", err);
    res.status(500).json({
      error: true,
      message: "An error occurred",
    });
  }
};

export const signUp = async (req, res) => {
  const { name, email, password, goal, age, occupation } = req.body;

  // Input validation
  if (!name || !email || !password) {
    return res.status(400).json({
      error: true,
      message: "Name, email, and password are required",
    });
  }

  try {
    const [isExistingEmail] = await connection.execute(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (isExistingEmail[0]) {
      return res.status(409).json({
        error: true,
        message: "Email is already in use.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const response = await connection.execute(
      "INSERT INTO users (name, email, password, goal, age, occupation) VALUES (?, ?, ?, ?, ?, ?)",
      [
        name,
        email,
        hashedPassword,
        goal || null,
        age || null,
        occupation || null,
      ]
    );

    return res.status(201).json({
      error: false,
      message: "User created successfully",
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({
      error: true,
      message: "An error occurred. Try again later.",
    });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: true,
      message: "Email and password are required",
    });
  }

  try {
    const [user] = await connection.execute(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (!user[0]) {
      return res.status(400).json({
        error: true,
        message: "Invalid email or password",
      });
    }

    const doPasswordsMatch = await bcrypt.compare(password, user[0].password);
    if (!doPasswordsMatch) {
      return res.status(400).json({
        error: true,
        message: "Invalid email or password",
      });
    }

    // Check if user is active (if you have an active status field)
    // if (user[0].status !== 'active') {
    //   return res.status(403).json({
    //     error: true,
    //     message: "Account is deactivated"
    //   });
    // }

    const accessToken = jwt.sign(
      {
        userId: user[0].user_id,
        name: user[0].name,
        role: user[0].role,
        email: user[0].email,
      },
      process.env.JWT_ACCESS_TOKEN,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      {
        userId: user[0].user_id,
        name: user[0].name,
        role: user[0].role,
        email: user[0].email,
      },
      process.env.JWT_REFRESH_TOKEN,
      { expiresIn: "7d" }
    );

    const userId = user[0].user_id;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await connection.execute(
      "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)",
      [userId, refreshToken, expiresAt]
    );

    res.cookie("accessToken", accessToken, {
      maxAge: 15 * 60 * 1000,
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    res.cookie("refreshToken", refreshToken, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    res.status(200).json({
      error: false,
      message: "You have successfully logged in",
      user: {
        id: user[0].user_id,
        name: user[0].name,
        email: user[0].email,
        role: user[0].role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      error: true,
      message: "An error occurred. Try again later.",
    });
  }
};

export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      await connection.execute("DELETE FROM refresh_tokens WHERE token = ?", [
        refreshToken,
      ]);
    }

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    res.status(200).json({
      error: false,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      error: true,
      message: "An error occurred during logout",
    });
  }
};

export const refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        error: true,
        message: "Access denied. Please log in.",
      });
    }

    const [tokens] = await connection.execute(
      "SELECT token, expires_at FROM refresh_tokens WHERE token = ?",
      [refreshToken]
    );

    if (tokens.length === 0) {
      return res.status(403).json({
        error: true,
        message: "Invalid refresh token. Please log in again.",
      });
    }

    const tokenData = tokens[0];
    const now = new Date();

    if (new Date(tokenData.expires_at) < now) {
      await connection.execute("DELETE FROM refresh_tokens WHERE token = ?", [
        refreshToken,
      ]);
      return res.status(403).json({
        error: true,
        message: "Refresh token expired. Please log in again.",
      });
    }

    let user;
    try {
      user = jwt.verify(refreshToken, process.env.JWT_REFRESH_TOKEN);
    } catch (jwtError) {
      await connection.execute("DELETE FROM refresh_tokens WHERE token = ?", [
        refreshToken,
      ]);
      return res.status(403).json({
        error: true,
        message: "Invalid refresh token. Please log in again.",
      });
    }

    const newAccessToken = jwt.sign(
      {
        userId: user.userId,
        name: user.name,
        role: user.role,
        email: user.email,
      },
      process.env.JWT_ACCESS_TOKEN,
      { expiresIn: "15m" }
    );

    res.cookie("accessToken", newAccessToken, {
      maxAge: 15 * 60 * 1000,
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    res.status(200).json({
      error: false,
      message: "Token refreshed successfully",
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(500).json({
      error: true,
      message: "An error occurred. Try again later.",
    });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({
        error: true,
        message: "Please provide a valid email address",
      });
    }

    const [users] = await connection.execute(
      "SELECT user_id, email FROM users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(200).json({
        error: false,
        message:
          "If an account exists with this email, you will receive a password reset link.",
      });
    }

    const user = users[0];

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const tokenExpiry = new Date(Date.now() + 3600000);

    await connection.execute(
      "UPDATE users SET reset_password_token = ?, reset_password_expires = ? WHERE user_id = ?",
      [hashedToken, tokenExpiry, user.user_id]
    );

    const jwtToken = jwt.sign(
      {
        userId: user.user_id,
        resetToken: resetToken,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${jwtToken}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Password Reset</h1>
        </div>
        <div style="padding: 30px; background-color: #f9f9f9; border-radius: 0 0 10px 10px;">
          <p>Hello,</p>
          <p>You requested to reset your password. Click the button below to create a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #4CAF50; 
                      color: white; 
                      padding: 14px 30px; 
                      text-align: center; 
                      text-decoration: none; 
                      display: inline-block; 
                      border-radius: 5px;
                      font-weight: bold;
                      font-size: 16px;">
              Reset Password
            </a>
          </div>
          <p>This link will expire in 1 hour for security reasons.</p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="background-color: #f0f0f0; padding: 10px; border-radius: 5px; word-break: break-all;">
            ${resetUrl}
          </p>
          <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            For security reasons, this link can only be used once. If you need to reset your password again, please submit a new request.
          </p>
        </div>
      </div>
    `;

    const text = `Password Reset Request\n\nYou requested to reset your password. Use the following link to reset it:\n\n${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you didn't request this, please ignore this email.`;
    const subject = "Password Reset Request - Action Required";

    await sendPasswordChangedEmail(email, subject, text, html);

    return res.status(200).json({
      error: false,
      message:
        "If an account exists with this email, you will receive a password reset link shortly.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({
      error: true,
      message:
        "An error occurred while processing your request. Please try again later.",
    });
  }
};

export const resetPassword = async (req, res) => {
  const { token, password, confirmPassword } = req.body;

  try {
    if (!token || !password || !confirmPassword) {
      return res.status(400).json({
        error: true,
        message: "Please provide all required fields",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        error: true,
        message: "Passwords do not match",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: true,
        message: "Password must be at least 8 characters long",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === "TokenExpiredError") {
        return res.status(400).json({
          error: true,
          message: "Password reset link has expired. Please request a new one.",
        });
      }
      return res.status(400).json({
        error: true,
        message: "Invalid reset token",
      });
    }

    const { userId, resetToken } = decoded;

    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const [users] = await connection.execute(
      "SELECT user_id, email FROM users WHERE user_id = ? AND reset_password_token = ? AND reset_password_expires > NOW()",
      [userId, hashedToken]
    );

    if (users.length === 0) {
      return res.status(400).json({
        error: true,
        message:
          "Invalid or expired reset token. Please request a new password reset.",
      });
    }

    const user = users[0];

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    await connection.execute(
      "UPDATE users SET password = ?, reset_password_token = NULL, reset_password_expires = NULL WHERE user_id = ?",
      [hashedPassword, user.user_id]
    );

    const htmlSuccess = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Password Changed Successfully</h1>
        </div>
        <div style="padding: 30px; background-color: #f9f9f9; border-radius: 0 0 10px 10px;">
          <p>Hello,</p>
          <p>Your password has been changed successfully.</p>
          <div style="text-align: center; margin: 30px 0;">
            <div style="background-color: #d4edda; color: #155724; padding: 15px; border-radius: 5px; display: inline-block;">
              <span style="font-size: 24px;">✓</span>
              <span style="font-weight: bold; margin-left: 10px;">Password Updated</span>
            </div>
          </div>
          <p>If you did not make this change, please contact our support team immediately.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            For security, please ensure you use a strong, unique password and never share it with anyone.
          </p>
        </div>
      </div>
    `;

    const textSuccess = `Your password has been changed successfully.\n\nIf you did not perform this action, please contact our support team immediately.\n\nThank you for keeping your account secure.`;
    const subjectSuccess = "Password Changed Successfully";

    await sendPasswordChangedEmail(
      user.email,
      subjectSuccess,
      textSuccess,
      htmlSuccess
    );

    return res.status(200).json({
      error: false,
      message:
        "Password has been reset successfully. You can now log in with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({
      error: true,
      message:
        "An error occurred while resetting your password. Please try again.",
    });
  }
};

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  const userId = req.user?.userId;

  try {
    if (!userId) {
      return res.status(401).json({
        error: true,
        message: "Authentication required",
      });
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        error: true,
        message: "Please provide all required fields",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        error: true,
        message: "New passwords do not match",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        error: true,
        message: "New password must be at least 8 characters long",
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        error: true,
        message: "New password must be different from current password",
      });
    }

    const [users] = await connection.execute(
      "SELECT user_id, password, email FROM users WHERE user_id = ?",
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        error: true,
        message: "User not found",
      });
    }

    const user = users[0];

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isPasswordValid) {
      return res.status(400).json({
        error: true,
        message: "Current password is incorrect",
      });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    await connection.execute(
      "UPDATE users SET password = ? WHERE user_id = ?",
      [hashedPassword, userId]
    );

    const subject = "Password Changed Successfully";
    const text = `Your password has been changed successfully.\n\nIf you did not make this change, please contact support immediately.`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Changed</h2>
        <p>Your password has been changed successfully.</p>
        <p>If you did not make this change, please contact our support team immediately.</p>
      </div>
    `;

    await sendPasswordChangedEmail(user.email, subject, text, html);

    return res.status(200).json({
      error: false,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({
      error: true,
      message: "An error occurred while changing password",
    });
  }
};
