import connection from "../database.js";

export const adminDashboard = async (req, res) => {
  try {
    //user focused
    const [rows] = await connection.execute("SELECT * FROM users");
    res.status(200).send({ data: rows, message: "Success" });
  } catch (error) {
    console.log("Admin error", error);
    res.json({
      error: true,
      message: "An error occurred. No budget was found",
    });
  }
};
