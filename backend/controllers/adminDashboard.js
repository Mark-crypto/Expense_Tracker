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
// no of users - SELECT COUNT(DISTINCT user_id) AS total_users FROM users;
// users created within a week from now - SELECT COUNT(*) AS users_last_week, name FROM users WHERE created_at >= NOW() - INTERVAL 7 DAY;
// users where status is active - SELECT COUNT(*) AS active_users, name FROM users WHERE status = 'active';
// users where status is inactive - SELECT COUNT(*) AS inactive_users, name FROM users WHERE status = 'inactive';
// SELECT name,email, goal FROM users
// users who are active and the users are grouped by the month they were created - SELECT COUNT(*) AS active_users, MONTH(created_at) AS month FROM users WHERE status = 'active' GROUP BY MONTH(created_at);
// SELECT name, role FROM users;
