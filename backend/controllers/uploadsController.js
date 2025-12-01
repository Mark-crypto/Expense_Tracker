import connection from "../database.js";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");
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
  let worker = null;

  try {
    if (!req.file) {
      return res.status(400).json({ message: "No receipt image uploaded" });
    }

    console.log("Starting OCR processing for receipt...");

    // Configure Tesseract with better options
    const {
      data: { text },
    } = await Tesseract.recognize(req.file.buffer, "eng", {
      logger: (progress) => {
        console.log("Tesseract Progress:", progress.status, progress.progress);
      },
      // Add configuration for better performance
      tessedit_pageseg_mode: "6", // Uniform block of text
      tessedit_char_whitelist:
        "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz .-@:/$%&()#,KESH",
      // Optimize for receipt processing
      tessedit_ocr_engine_mode: "3", // Default + LSTM
    });

    console.log("OCR Extracted Text:", text);

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        message:
          "No text could be extracted from the image. Please try a clearer image.",
      });
    }

    // Extract structured data from OCR text
    const extractedData = extractReceiptData(text);

    console.log("Extracted Data:", extractedData);

    return res.status(200).json({
      message: "Receipt processed successfully",
      extractedData: {
        amount: extractedData.amount,
        date: extractedData.date,
        description: extractedData.description,
        merchant: extractedData.merchant,
        category: "Expenses", // Default category based on receipt type
        subcategory: "Healthcare", // Based on merchant name
        rawText: text.substring(0, 500), // Limited for debugging
      },
    });
  } catch (error) {
    console.error("RECEIPT OCR ERROR:", error);

    // Specific error handling
    if (error.message.includes("timeout")) {
      return res.status(408).json({
        message:
          "OCR processing timed out. Please try again with a clearer image.",
      });
    }

    return res.status(500).json({
      message: "Failed to process receipt image",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  } finally {
    // Clean up worker if it exists
    if (worker) {
      try {
        await worker.terminate();
      } catch (terminateError) {
        console.error("Error terminating worker:", terminateError);
      }
    }
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
