import { buildMoneyXray } from "../utils/moneyXray.js";

export const getXray = async (req, res) => {
  const userId = parseInt(req.user.userId);
  try {
    res.status(200).json({ xray: await buildMoneyXray(userId, req.query.period) });
  } catch (error) {
    console.log("Error:", error);
    res.status(500).json({
      error: true,
      message: "An error occurred. Your report could not be loaded.",
    });
  }
};
