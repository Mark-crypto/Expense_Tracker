import connection from "../database.js";

export const getNotifications = async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const userId = req.user.userId;

  res.write(
    `data: ${JSON.stringify({
      message: "Connected to notification stream",
    })}\n\n`
  );

  try {
    const interval = setInterval(async () => {
      const [rows] = await connection.execute(
        "SELECT * FROM notifications WHERE user_id = ? AND status = 'unread' ORDER BY created_at DESC LIMIT 5",
        [userId]
      );
      if (rows.length > 0) {
        res.write(`data: ${JSON.stringify(rows)}\n\n`);
        await connection.execute(
          "UPDATE notifications SET status = 'resolved' WHERE user_id = ? AND status = 'unread'",
          [userId]
        );
      }
    }, 30000);

    req.on("close", () => {
      clearInterval(interval);
      res.end();
    });
  } catch (error) {
    console.error("SSE Error:", error);
    res.status(500).json({ error: "Server-Sent Events error occurred" });
  }
};
