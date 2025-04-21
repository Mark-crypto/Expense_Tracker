import connection from "../database.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export const signUp = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const isExistingEmail = await connection.execute(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );
    if (isExistingEmail) {
      return res
        .status(500)
        .json({ error: true, message: "Email is already in use." });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const response = await connection.execute(
      "INSERT INTO users SET name=?, email=?, password=?",
      [name, email, hashedPassword]
    );
    if (response) {
      return res.status(201).json({ message: "User created successfully" });
    }
    return res
      .status(500)
      .json({ error: true, message: "An error occurred. Try again later." });
  } catch (error) {
    res.status(500).json({ error: true, message: "An error occurred" });
    console.log("Error:", error);
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await connection.execute(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );
    if (!user) {
      return res
        .status(401)
        .json({ error: true, message: "Invalid email or password" });
    }
    const doPasswordsMatch = await bcrypt.compare(password, user.password);
    if (doPasswordsMatch === false) {
      return res
        .status(401)
        .json({ error: true, message: "Invalid email or password" });
    }
    jwt.sign(
      { userId: user.id, name: user.name, email: user.email },
      process.env.JWT_SECRET_KEY
    );
  } catch (error) {
    res.status(500).json({ error: true, message: "An error occurred" });
    console.log("Error:", error);
  }
};

export const getUser = (req, res) => {};

export const logout = async (req, res) => {};
