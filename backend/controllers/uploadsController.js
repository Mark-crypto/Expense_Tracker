import connection from "../database.js";
import pdfParse from "pdf-parse";
import Tesseract from "tesseract.js";
import { extractMpesaLines } from "../utils/extractMpesaLines.js";
import { extractReceiptData } from "../utils/extractReceiptData.js";

export const createMpesaExpense = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No PDF uploaded" });
    }
    const parsed = await pdfParse(req.file.buffer);
    const text = parsed.text;
    const expenses = extractMpesaLines(text);

    return res.status(200).json({
      message: "PDF parsed successfully",
      expenses,
    });
  } catch (error) {
    console.error("MPESA PDF ERROR:", error);
    return res.status(500).json({ message: "Failed to process PDF" });
  }
};

export const saveMpesaTransactions = async (req, res) => {
  try {
    const { transactions } = req.body;

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({ message: "No transactions provided" });
    }

    const userId = parseInt(req.user.userId);

    const values = transactions.map((transaction) => {
      const month = new Date(transaction.date).toLocaleString("default", {
        month: "long",
      });

      return [
        transaction.amount,
        transaction.category,
        transaction.date,
        month,
        userId,
        transaction.subcategory,
        transaction.budgeted ? 1 : 0,
        null, // budget_id for now
        transaction.description || "",
      ];
    });

    // Updated SQL to include description
    const sql = `
      INSERT INTO expense 
      (amount, category, date_created, month, user_id, subcategories, budgeted, budget_id, description)
      VALUES ?
    `;

    const [response] = await connection.query(sql, [values]);

    return res.status(200).json({
      message: `Saved ${response.affectedRows} M-Pesa transaction(s) successfully`,
      savedCount: response.affectedRows,
    });
  } catch (error) {
    console.error("DB MULTI INSERT ERROR:", error);
    return res.status(500).json({
      message: "Failed to save M-Pesa transactions",
      error: error.message,
    });
  }
};

export const createReceiptExpense = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No receipt image uploaded" });
    }

    // Perform OCR on the image
    const {
      data: { text },
    } = await Tesseract.recognize(req.file.buffer, "eng", {
      logger: (m) => console.log(m), // Remove in production
    });

    console.log("OCR Extracted Text:", text);

    // Extract structured data from OCR text
    const extractedData = extractReceiptData(text);

    return res.status(200).json({
      message: "Receipt processed successfully",
      extractedData: {
        amount: extractedData.amount,
        date: extractedData.date,
        description: extractedData.description,
        merchant: extractedData.merchant,
        category: "Uncategorized", // Default category
        subcategory: "Unknown", // Default subcategory
        rawText: text, // For debugging
      },
    });
  } catch (error) {
    console.error("RECEIPT OCR ERROR:", error);
    return res.status(500).json({
      message: "Failed to process receipt image",
      error: error.message,
    });
  }
};

export const saveReceiptExpense = async (req, res) => {
  try {
    const {
      amount,
      date,
      description,
      category,
      subcategory,
      merchant,
      budgeted,
    } = req.body;

    // Validate required fields
    if (!amount || !date || !description) {
      return res.status(400).json({
        message:
          "Missing required fields: amount, date, and description are required",
      });
    }

    const userId = parseInt(req.user.userId);
    const month = new Date(date).toLocaleString("default", { month: "long" });

    const sql = `
      INSERT INTO expense 
      (amount, category, date_created, month, user_id, subcategories, budgeted, budget_id, description, merchant)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      parseFloat(amount),
      category,
      date,
      month,
      userId,
      subcategory,
      budgeted ? 1 : 0,
      null, // budget_id for now
      description,
      merchant || null,
    ];

    const [response] = await connection.query(sql, values);

    return res.status(200).json({
      message: "Expense saved successfully",
      expenseId: response.insertId,
      savedCount: 1,
    });
  } catch (error) {
    console.error("DB EXPENSE SAVE ERROR:", error);
    return res.status(500).json({
      message: "Failed to save expense",
      error: error.message,
    });
  }
};
