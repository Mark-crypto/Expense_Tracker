import connection from "../database.js";

export const getNotifications = async (req, res) => {
  const userId = req.user.userId;
  try {
    const [notifications] = await connection.execute(
      " SELECT * FROM notifications WHERE user_id = ? AND status = 'unread' ORDER BY created_at DESC ",
      [userId]
    );
    res.status(200).json({ data: notifications });
  } catch (error) {
    console.log("Error:", error);
    return res.status(500).json({
      error: true,
      message: "An error occurred. No notifications were found.",
    });
  }
};

export const markNotificationAsRead = async (req, res) => {
  const userId = req.user.userId;
  let { notificationId } = req.params;
  notificationId = Number(notificationId);
  try {
    const [result] = await connection.execute(
      " UPDATE notifications SET status = 'read' WHERE id = ? AND user_id = ? ",
      [notificationId, userId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: true,
        message: "Notification not found or already marked as read.",
      });
    }
    await connection.execute(
      " UPDATE budget SET notified_exceeded = 1 WHERE budget_id = (SELECT budget_id FROM notifications WHERE id = ? ) ",
      [notificationId]
    );

    res.status(200).json({ message: "Notification marked as read." });
  } catch (error) {
    console.log("Error:", error);
    return res.status(500).json({
      error: true,
      message:
        "An error occurred. The notification could not be marked as read.",
    });
  }
};

export const implementNotificationAction = async (req, res) => {
  const userId = req.user.userId;
  let { notificationId } = req.params;
  notificationId = Number(notificationId);
  const { action, newAmount } = req.body;

  try {
    if (action === "deactivate-budget") {
      await connection.execute(
        " UPDATE budget SET status = 'inactive' WHERE user_id = ? AND budget_id = (SELECT budget_id FROM notifications WHERE id = ? ) ",
        [userId, notificationId]
      );
    } else if (action === "keep-active") {
      // No action needed for keep-active
    } else if (action === "increase-budget") {
      await connection.execute(
        " UPDATE budget SET amount = amount * 1.15 WHERE user_id = ? AND budget_id = (SELECT budget_id FROM notifications WHERE id = ? ) ",
        [userId, notificationId]
      );
      const [[budget]] = await connection.execute(
        `SELECT budget_id, name, amount, email_checked, notify_email, status FROM budget WHERE budget_id = (SELECT budget_id FROM notifications WHERE id = ? ) AND user_id = ?`,
        [notificationId, userId]
      );

      const [[{ total_spent }]] = await connection.execute(
        `SELECT COALESCE(SUM(amount), 0) AS total_spent FROM expense WHERE budget_id = ?`,
        [budget.budget_id]
      );
      if (Number(total_spent) <= Number(budget.amount)) {
        await connection.execute(
          " UPDATE budget SET notified_exceeded = 0, notify_email = 0, status = 'active' WHERE budget_id = ? AND user_id = ? ",
          [budget.budget_id, userId]
        );
      }
    } else if (action === "set-custom-limit" && newAmount) {
      await connection.execute(
        " UPDATE budget SET amount = ? WHERE user_id = ? AND budget_id = (SELECT budget_id FROM notifications WHERE id = ? ) ",
        [newAmount, userId, notificationId]
      );
      const [[budget]] = await connection.execute(
        `SELECT budget_id, name, amount, email_checked, notify_email, status FROM budget WHERE budget_id = (SELECT budget_id FROM notifications WHERE id = ? ) AND user_id = ?`,
        [notificationId, userId]
      );

      const [[{ total_spent }]] = await connection.execute(
        `SELECT COALESCE(SUM(amount), 0) AS total_spent FROM expense WHERE budget_id = ?`,
        [budget.budget_id]
      );
      if (Number(total_spent) <= Number(budget.amount)) {
        await connection.execute(
          " UPDATE budget SET notified_exceeded = 0, notify_email = 0, status = 'active' WHERE budget_id = ? AND user_id = ? ",
          [budget.budget_id, userId]
        );
      }
    } else {
      return res.status(400).json({
        error: true,
        message: "Invalid action or missing parameters.",
      });
    }
    res
      .status(200)
      .json({ message: "Notification action implemented successfully." });
  } catch (error) {
    console.log("Error for notification action:", error);
    return res.status(500).json({
      error: true,
      message:
        "An error occurred. The notification action could not be implemented.",
    });
  }
};
