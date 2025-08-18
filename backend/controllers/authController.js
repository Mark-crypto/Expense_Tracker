import connection from "../database.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
//add crypto.randomBytes(64).toString('hex')
//Check expires at on table token
//look into winston for prpoduction logging
//Sanitize inputs with express-validator

export const signUp = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const [isExistingEmail] = await connection.execute(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );
    console.log(isExistingEmail);
    if (isExistingEmail[0]) {
      return res
        .status(409)
        .json({ error: true, message: "Email is already in use." });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const response = await connection.execute(
      "INSERT INTO users (name, email, password) VALUES(?,?,?)",
      [name, email, hashedPassword]
    );
    if (!response) {
      return res
        .status(400)
        .json({ error: true, message: "An error occurred. Try again later." });
    }
    return res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    res.status(500).json({
      error: true,
      message: "An error occurred. Try again later.",
    });
    console.log("Error:", error);
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const [user] = await connection.execute(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );
    if (!user[0]) {
      return res
        .status(400)
        .json({ error: true, message: "Invalid email or password" });
    }
    const doPasswordsMatch = await bcrypt.compare(password, user[0].password);
    if (!doPasswordsMatch) {
      return res
        .status(400)
        .json({ error: true, message: "Invalid email or password" });
    }
    const accessToken = jwt.sign(
      { userId: user[0].user_id, name: user[0].name, role: user[0].role },
      process.env.JWT_ACCESS_TOKEN,
      { expiresIn: "15m" }
    ); 
    const refreshToken = jwt.sign(
      { userId: user[0].user_id, name: user[0].name, role: user[0].role },
      process.env.JWT_REFRESH_TOKEN,
      { expiresIn: "7d" }
    );
    const userId = user[0].user_id;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await connection.execute(
      "INSERT INTO refresh_tokens(user_id,token,expires_at) VALUES (?,?,?)",
      [userId, refreshToken, expiresAt]
    );
    if (!accessToken || !refreshToken) {
      return res
        .status(400)
        .json({ error: true, message: "An error occurred. Try again later." });
    }
    res.cookie("accessToken", accessToken, {
      maxAge: 15 * 60 * 1000,
      httpOnly: true,
      sameSite:'strict',
      secure: process.env.NODE_ENV === "production",
    });
    res.cookie("refreshToken", refreshToken, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite:'strict',
      secure: process.env.NODE_ENV === "production",
    });
    res.status(200).json({ message: "You have successfully logged in" });
  } catch (error) {
    res
      .status(500)
      .json({ error: true, message: "An error occurred. Try again later." });
    console.log("Login Error:", error);
  }
};

export const logout = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ message: "Access denied. Log in" });
  }
  await connection.execute("DELETE FROM refresh_tokens WHERE token=?", [
    refreshToken,
  ]);
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  res.status(200).json({ message: "Logged out successfully" });
};

export const refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: "Access denied. Log in " });
    }
    const token = await connection.execute(
      "SELECT token,expires_at FROM refresh_tokens WHERE token=?",
      [refreshToken]
    );
    if (!token.length) {
      return res.status(403).json({ message: "Access denied. Log in" });
    }
    const now = new Date();
    if(new Date(token[0][0].expires_at) < now){
      return res.status(403).json({ message: "Token expired. Log in again." });
    }
    const user = jwt.verify(refreshToken, process.env.JWT_REFRESH_TOKEN);
    const newAccessToken = jwt.sign(
      { name: user.name, userId: user.userId, role: user.role },
      process.env.JWT_ACCESS_TOKEN,
      { expiresIn: "15m" }
    );

    res.cookie("accessToken", newAccessToken, {
      maxAge: 15 * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
    res.status(200).json({ message: "Token refreshed successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ error: true, message: "An error occurred. Try again later." });
    console.log("Error:", error);
  }
};
