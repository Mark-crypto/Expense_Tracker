import connection from "../database.js";

export const getPredictions = async (req, res) => {
  try {
    const [rows] = await connection.execute(`
      SELECT DISTINCT month,
      AVG(amount) OVER(ORDER BY month) AS monthly_average
      FROM expense`);
    res
      .status(200)
      .json({
        data: rows,
        message: "Your predicted data is successfully retrieved",
      });
  } catch (error) {
    console.log("Error:", error);
    res
      .status(500)
      .json({ error: true, message: "Something went wrong. Try again later." });
  }
};
