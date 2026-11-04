import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const escapeHtml = (text) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const sendBudgetEmail = async (to, subject, lines) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  const link = `${process.env.FRONTEND_URL ?? ""}/budget?alerts=1`;
  const footer = "Change or turn off these emails in your alert settings:";
  try {
    await transporter.sendMail({
      from: `"Budget Tracker" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text: [...lines, "", footer, link].join("\n"),
      html: `<p>${lines.map(escapeHtml).join("<br>")}</p><p>${footer} <a href="${link}">Alert settings</a></p>`,
    });
  } catch (error) {
    console.error("Error sending budget email:", error);
  }
};

// Sign-in and PIN changes, with what to do if it wasn't them.
export const sendSecurityEmail = async (to, subject, lines) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  const link = `${process.env.FRONTEND_URL ?? ""}/forgot-password`;
  const footer = "If this wasn't you, reset your password now:";
  try {
    await transporter.sendMail({
      from: `"Budget Tracker" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text: [...lines, "", footer, link].join("\n"),
      html: `<p>${lines.map(escapeHtml).join("<br>")}</p><p>${footer} <a href="${link}">Reset password</a></p>`,
    });
  } catch (error) {
    console.error("Error sending security email:", error);
  }
};

export const sendReminderEmail = async (to, lines) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  const footer = "You can turn these reminders off on the Bills & Subscriptions page.";
  try {
    await transporter.sendMail({
      from: `"Budget Tracker" <${process.env.EMAIL_USER}>`,
      to,
      subject: lines.length === 1 ? "A payment is coming up" : `${lines.length} payments are coming up`,
      text: [...lines, "", footer].join("\n"),
      html: `<p>${lines.map(escapeHtml).join("<br>")}</p><p>${footer}</p>`,
    });
  } catch (error) {
    console.error("Error sending bill reminder:", error);
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
    console.log(`Account email sent: ${info.messageId}`);
  } catch (error) {
    console.error("Error sending password reset email:", error);
  }
};
