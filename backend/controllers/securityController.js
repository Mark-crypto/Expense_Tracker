import bcrypt from "bcryptjs";
import connection from "../database.js";
import {
  isWeakPin,
  LOCK_MS,
  loadSecurity,
  lockDevice,
  MAX_TRIES,
  nairobiTime,
  tellOwner,
  unlockDevice,
  unlockedUntil,
} from "../utils/security.js";

const fail = (res, message, error) => {
  console.error(message, error);
  res.status(500).json({ error: true, message });
};

const userIdOf = (req) => parseInt(req.user.userId);

const lockedMessage = (until) => `PIN locked until ${nairobiTime(until)}. You can reset it with your password now.`;

export const getSecurity = async (req, res) => {
  const userId = userIdOf(req);
  try {
    const security = await loadSecurity(userId);
    const [[{ devices }]] = await connection.execute(
      "SELECT COUNT(*) AS devices FROM refresh_tokens WHERE user_id = ? AND expires_at > NOW()",
      [userId]
    );
    const locked = security.pin_locked_until > Date.now() ? security.pin_locked_until : null;
    res.status(200).json({
      pinSet: !!security.pin_hash,
      pinLockedUntil: locked,
      unlockedUntil: security.pin_hash ? unlockedUntil(req, userId, security.pin_set_at) : null,
      passwordChangedAt: security.password_changed_at,
      devices: Number(devices),
    });
  } catch (error) {
    fail(res, "Your security settings could not be loaded.", error);
  }
};

const savePin = async (req, res, userId, email, pin, changed) => {
  if (isWeakPin(pin)) {
    return res.status(400).json({ error: true, message: `${pin} is too easy to guess. Choose another PIN.` });
  }
  const setAt = Date.now();
  await connection.execute(
    "UPDATE users SET pin_hash = ?, pin_set_at = ?, pin_failures = 0, pin_locked_until = NULL WHERE user_id = ?",
    [await bcrypt.hash(pin, 10), setAt, userId]
  );
  const until = unlockDevice(res, userId, setAt);
  await tellOwner(email, changed ? "Your PIN was changed" : "You set a PIN", changed ? "The PIN on your Expense Tracker account was changed." : "You set a PIN on your Expense Tracker account.");
  res.status(200).json({ message: changed ? "PIN changed." : "PIN set.", unlockedUntil: until });
};

// Setting a first PIN needs nothing more; changing one needs this device unlocked (see routes).
export const setPin = async (req, res) => {
  const userId = userIdOf(req);
  try {
    const security = await loadSecurity(userId);
    await savePin(req, res, userId, security.email, req.body.pin, !!security.pin_hash);
  } catch (error) {
    fail(res, "Your PIN could not be saved.", error);
  }
};

export const resetPin = async (req, res) => {
  const userId = userIdOf(req);
  try {
    const security = await loadSecurity(userId);
    if (!(await bcrypt.compare(req.body.password, security.password))) {
      return res.status(400).json({ error: true, message: "That password isn't right." });
    }
    await savePin(req, res, userId, security.email, req.body.pin, !!security.pin_hash);
  } catch (error) {
    fail(res, "Your PIN could not be reset.", error);
  }
};

// Five wrong tries lock the PIN for 15 minutes, whatever device they come from.
export const verifyPin = async (req, res) => {
  const userId = userIdOf(req);
  try {
    const security = await loadSecurity(userId);
    if (!security.pin_hash) return res.status(400).json({ error: true, message: "You haven't set a PIN." });
    if (security.pin_locked_until > Date.now()) {
      return res.status(429).json({ error: true, lockedUntil: security.pin_locked_until, message: lockedMessage(security.pin_locked_until) });
    }

    if (await bcrypt.compare(req.body.pin, security.pin_hash)) {
      await connection.execute("UPDATE users SET pin_failures = 0, pin_locked_until = NULL WHERE user_id = ?", [userId]);
      return res.status(200).json({ message: "Unlocked.", unlockedUntil: unlockDevice(res, userId, security.pin_set_at) });
    }

    const failures = security.pin_failures + 1;
    if (failures >= MAX_TRIES) {
      const until = Date.now() + LOCK_MS;
      await connection.execute("UPDATE users SET pin_failures = 0, pin_locked_until = ? WHERE user_id = ?", [until, userId]);
      return res.status(429).json({ error: true, lockedUntil: until, message: lockedMessage(until) });
    }
    await connection.execute("UPDATE users SET pin_failures = ? WHERE user_id = ?", [failures, userId]);
    const left = MAX_TRIES - failures;
    res.status(400).json({
      error: true,
      triesLeft: left,
      message: `Wrong PIN. ${left} ${left === 1 ? "try" : "tries"} left before it locks for 15 minutes.`,
    });
  } catch (error) {
    fail(res, "Your PIN could not be checked.", error);
  }
};

export const removePin = async (req, res) => {
  const userId = userIdOf(req);
  try {
    const security = await loadSecurity(userId);
    await connection.execute(
      "UPDATE users SET pin_hash = NULL, pin_set_at = NULL, pin_failures = 0, pin_locked_until = NULL WHERE user_id = ?",
      [userId]
    );
    lockDevice(res);
    await tellOwner(security.email, "Your PIN was turned off", "The PIN on your Expense Tracker account was turned off.");
    res.status(200).json({ message: "PIN turned off." });
  } catch (error) {
    fail(res, "Your PIN could not be turned off.", error);
  }
};

// Other devices are signed out, so an old password stops working everywhere.
export const changePassword = async (req, res) => {
  const userId = userIdOf(req);
  const { current, next } = req.body;
  try {
    const security = await loadSecurity(userId);
    if (!(await bcrypt.compare(current, security.password))) {
      return res.status(400).json({ error: true, message: "Your current password isn't right." });
    }
    await connection.execute("UPDATE users SET password = ?, password_changed_at = ? WHERE user_id = ?", [
      await bcrypt.hash(next, 10),
      Date.now(),
      userId,
    ]);
    await connection.execute("DELETE FROM refresh_tokens WHERE user_id = ? AND token <> ?", [
      userId,
      req.cookies.refreshToken ?? "",
    ]);
    await tellOwner(security.email, "Your password was changed", "The password on your Expense Tracker account was changed.");
    res.status(200).json({ message: "Password changed. Other devices have been signed out." });
  } catch (error) {
    fail(res, "Your password could not be changed.", error);
  }
};

export const signOutOthers = async (req, res) => {
  try {
    const [result] = await connection.execute("DELETE FROM refresh_tokens WHERE user_id = ? AND token <> ?", [
      userIdOf(req),
      req.cookies.refreshToken ?? "",
    ]);
    const count = result.affectedRows;
    res.status(200).json({
      message: count === 0 ? "No other devices were signed in." : `Signed out of ${count} other ${count === 1 ? "device" : "devices"}.`,
    });
  } catch (error) {
    fail(res, "This could not be done.", error);
  }
};
