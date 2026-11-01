import connection from "../database.js";
import { buildForecast, syncForecastAlerts } from "../utils/forecast.js";

export const getForecast = async (req, res) => {
  const userId = parseInt(req.user.userId);
  try {
    const forecast = await buildForecast(userId);
    await syncForecastAlerts(userId, forecast);
    res.status(200).json(forecast);
  } catch (error) {
    console.error("Error in getForecast:", error);
    res.status(500).json({ error: true, message: "Your forecast could not be loaded." });
  }
};

export const dismissBill = async (req, res) => {
  const userId = parseInt(req.user.userId);
  try {
    await connection.execute(
      "INSERT IGNORE INTO dismissed_bills (user_id, bill_key) VALUES (?, ?)",
      [userId, req.body.key]
    );
    res.status(200).json({ message: "Removed from your bills." });
  } catch (error) {
    console.error("Error dismissing bill:", error);
    res.status(500).json({ error: true, message: "Could not remove this bill." });
  }
};

export const restoreBill = async (req, res) => {
  const userId = parseInt(req.user.userId);
  try {
    await connection.execute("DELETE FROM dismissed_bills WHERE user_id = ? AND bill_key = ?", [
      userId,
      req.body.key,
    ]);
    res.status(200).json({ message: "Bill restored." });
  } catch (error) {
    console.error("Error restoring bill:", error);
    res.status(500).json({ error: true, message: "Could not restore this bill." });
  }
};
