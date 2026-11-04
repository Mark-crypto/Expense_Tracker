import connection from "../database.js";

const fail = (res, message, error) => {
  console.error(message, error);
  res.status(500).json({ error: true, message });
};

const userIdOf = (req) => parseInt(req.user.userId);

const has = async (sql, userId) => {
  const [rows] = await connection.execute(`${sql} LIMIT 1`, [userId]);
  return rows.length > 0;
};

// What's done is read from the data itself, so work done outside setup counts too.
export const getSetup = async (req, res) => {
  const userId = userIdOf(req);
  try {
    const [[user]] = await connection.execute(
      "SELECT name, setup_status, setup_step, setup_hidden, pay_set, tips_seen, pin_hash FROM users WHERE user_id = ?",
      [userId]
    );
    res.status(200).json({
      status: user.setup_status,
      step: user.setup_step,
      hidden: user.setup_hidden === 1,
      tipsSeen: user.tips_seen ? user.tips_seen.split(",") : [],
      firstName: (user.name ?? "").trim().split(/\s+/)[0],
      done: {
        statement: await has("SELECT 1 FROM mpesa_transactions WHERE user_id = ?", userId),
        accounts: await has("SELECT 1 FROM accounts WHERE user_id = ? AND status = 'active'", userId),
        payDay: user.pay_set === 1,
        bills: await has("SELECT 1 FROM recurring_payments WHERE user_id = ?", userId),
        budgets: await has("SELECT 1 FROM budget WHERE user_id = ?", userId),
        pin: !!user.pin_hash,
        goal: await has("SELECT 1 FROM savings_goals WHERE user_id = ?", userId),
      },
    });
  } catch (error) {
    fail(res, "Your setup could not be loaded.", error);
  }
};

export const saveSetup = async (req, res) => {
  const { step, status } = req.body;
  try {
    await connection.execute(
      "UPDATE users SET setup_step = COALESCE(?, setup_step), setup_status = COALESCE(?, setup_status) WHERE user_id = ?",
      [step ?? null, status ?? null, userIdOf(req)]
    );
    res.status(200).json({ message: "Saved." });
  } catch (error) {
    fail(res, "Your setup could not be saved.", error);
  }
};

export const hideSetup = async (req, res) => {
  try {
    await connection.execute("UPDATE users SET setup_hidden = 1 WHERE user_id = ?", [userIdOf(req)]);
    res.status(200).json({ message: "Hidden." });
  } catch (error) {
    fail(res, "This could not be saved.", error);
  }
};

export const seeTip = async (req, res) => {
  const userId = userIdOf(req);
  try {
    const [[user]] = await connection.execute("SELECT tips_seen FROM users WHERE user_id = ?", [userId]);
    const seen = new Set(user.tips_seen ? user.tips_seen.split(",") : []);
    seen.add(req.body.tip);
    await connection.execute("UPDATE users SET tips_seen = ? WHERE user_id = ?", [[...seen].join(","), userId]);
    res.status(200).json({ message: "Saved." });
  } catch (error) {
    fail(res, "This could not be saved.", error);
  }
};
