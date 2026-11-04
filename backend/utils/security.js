import jwt from "jsonwebtoken";
import connection from "../database.js";
import { sendSecurityEmail } from "./emailAlert.js";

export const MAX_TRIES = 5;
export const LOCK_MS = 15 * 60 * 1000;
export const UNLOCK_MS = 10 * 60 * 1000;
export const PIN_COOKIE = "pinUnlock";

export const nairobiTime = (ms) =>
  new Date(ms).toLocaleTimeString("en-GB", { timeZone: "Africa/Nairobi", hour: "2-digit", minute: "2-digit" });

// Repeated digits, runs like 1234 or 9876, and pairs like 1212 are the first ones tried.
export const isWeakPin = (pin) => {
  const digits = [...pin].map(Number);
  const steps = digits.slice(1).map((digit, index) => digit - digits[index]);
  return (
    steps.every((step) => step === 0) ||
    steps.every((step) => step === 1) ||
    steps.every((step) => step === -1) ||
    (pin[0] === pin[2] && pin[1] === pin[3])
  );
};

const cookieOptions = {
  httpOnly: true,
  sameSite: "strict",
  secure: process.env.NODE_ENV === "production",
};

// The unlock belongs to this device and this PIN; setting a new PIN ends it.
export const unlockDevice = (res, userId, pinSetAt) => {
  const token = jwt.sign({ userId, pin: pinSetAt, purpose: "pin" }, process.env.JWT_ACCESS_TOKEN, {
    expiresIn: UNLOCK_MS / 1000,
  });
  res.cookie(PIN_COOKIE, token, { ...cookieOptions, maxAge: UNLOCK_MS });
  return Date.now() + UNLOCK_MS;
};

export const lockDevice = (res) => res.clearCookie(PIN_COOKIE, cookieOptions);

// When this device's unlock runs out, or null if it isn't unlocked.
export const unlockedUntil = (req, userId, pinSetAt) => {
  try {
    const token = jwt.verify(req.cookies?.[PIN_COOKIE] ?? "", process.env.JWT_ACCESS_TOKEN);
    if (token.purpose !== "pin" || token.userId !== userId || token.pin !== pinSetAt) return null;
    return token.exp * 1000;
  } catch {
    return null;
  }
};

export const loadSecurity = async (userId) => {
  const [[row]] = await connection.execute(
    `SELECT email, password, pin_hash, pin_set_at, pin_failures, pin_locked_until, password_changed_at
    FROM users WHERE user_id = ?`,
    [userId]
  );
  return row
    ? {
        ...row,
        pin_set_at: row.pin_set_at === null ? null : Number(row.pin_set_at),
        pin_locked_until: row.pin_locked_until === null ? null : Number(row.pin_locked_until),
        password_changed_at: row.password_changed_at === null ? null : Number(row.password_changed_at),
      }
    : null;
};

// Guards a route behind the PIN, for people who have set one.
export const requirePin = async (req, res, next) => {
  try {
    const userId = parseInt(req.user.userId);
    const security = await loadSecurity(userId);
    if (!security?.pin_hash || unlockedUntil(req, userId, security.pin_set_at)) return next();
    res.status(423).json({ error: true, pinRequired: true, message: "Enter your PIN to continue." });
  } catch (error) {
    console.error("PIN check failed:", error);
    res.status(500).json({ error: true, message: "Something went wrong." });
  }
};

export const tellOwner = (email, subject, line) =>
  sendSecurityEmail(email, subject, [line, `Time: ${nairobiTime(Date.now())}, Nairobi.`]);
