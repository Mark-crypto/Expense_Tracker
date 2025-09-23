import connection from "../database.js";

export const adminDashboard = async (req, res) => {
  try {
    const [allUsers] = await connection.execute(
      "SELECT user_id, name, email,status, role,occupation, age,goal FROM users"
    );
    const [totalUsers] = await connection.execute(
      "SELECT COUNT(DISTINCT user_id) AS total_users FROM users"
    );
    const [newUsers] = await connection.execute(
      "SELECT COUNT(*) AS users_last_week FROM users WHERE created_at >= NOW() - INTERVAL 7 DAY"
    );
    const [activeUsers] = await connection.execute(
      "SELECT COUNT(*) AS active_users FROM users WHERE status = 'active'"
    );
    const [inactiveUsers] = await connection.execute(
      "SELECT COUNT(*) AS inactive_users FROM users WHERE status = 'inactive'"
    );
    const [activeByMonth] = await connection.execute(
      "SELECT COUNT(*) AS active_users, MONTH(created_at) AS month FROM users WHERE status = 'active' GROUP BY MONTH(created_at)"
    );
    res.status(200).send({
      data: {
        allUsers,
        totalUsers,
        newUsers,
        activeUsers,
        inactiveUsers,
        activeByMonth,
      },
      message: "Success",
    });
  } catch (error) {
    console.log("Admin error", error);
    res.json({
      error: true,
      message: "An error occurred. No budget was found",
    });
  }
};
