import connection from "../database.js";
import { buildXray } from "../utils/buildXray.js";

export const getXray = async (req, res) => {
  const userId = parseInt(req.user.userId);
  try {
    const [rows] = await connection.execute(
      `SELECT DATE_FORMAT(occurred_at, '%Y-%m-%d %H:%i:%s') AS occurredAt,
        kind, counterparty, paid_in AS paidIn, withdrawn
      FROM mpesa_transactions
      WHERE user_id = ?`,
      [userId]
    );
    res.status(200).json({ xray: buildXray(rows) });
  } catch (error) {
    console.log("Error:", error);
    res.status(500).json({
      error: true,
      message: "An error occurred. Your report could not be loaded.",
    });
  }
};
