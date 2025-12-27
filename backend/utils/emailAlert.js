import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();
import connection from "../database.js";

export const sendEmail = async (to, subject, text, html, budgetId) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"Budget Tracker" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    await connection.execute(
      "UPDATE budget SET notify_email = 1 WHERE budget_id = ?",
      [budgetId]
    );
    console.log(`Email sent to ${to}: ${info.messageId}`);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

export const sendPasswordChangedEmail = async (to, subject, text, html) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  const mailOptions = {
    from: `"Budget Tracker" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  };
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${to}: ${info.messageId}`);
  } catch (error) {
    console.error("Error sending password reset email:", error);
  }
};
