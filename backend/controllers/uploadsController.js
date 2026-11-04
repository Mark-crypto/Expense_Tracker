import connection from "../database.js";
import Tesseract from "tesseract.js";
import { extractMpesaLines } from "../utils/extractMpesaLines.js";
import { accountOfType, chooseAccount, syncStatementBalances } from "../utils/accounts.js";
import { ownBudgetId, refreshUserBudgets } from "../utils/budgetStatus.js";
import { recordRealPayments } from "../utils/recurring.js";
import { buildXray } from "../utils/buildXray.js";
import { extractPdfText } from "../utils/extractPdfText.js";
import { extractReceiptData } from "../utils/extractReceiptData.js";
import { PasswordResponses } from "pdfjs-dist/legacy/build/pdf.mjs";
import { maskPhones } from "../utils/maskPhones.js";

export const createMpesaExpense = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No PDF uploaded" });
  }

  try {
    const text = await extractPdfText(req.file.buffer, req.body.password);
    const userId = parseInt(req.user.userId);

    const [remembered] = await connection.execute(
      "SELECT merchant, category FROM merchant_categories WHERE user_id = ?",
      [userId]
    );
    const [imported] = await connection.execute(
      "SELECT receipt_no FROM expense WHERE user_id = ? AND status = 'active' AND receipt_no IS NOT NULL",
      [userId]
    );
    const categories = new Map(remembered.map((row) => [row.merchant, row.category]));
    const importedReceipts = new Set(imported.map((row) => row.receipt_no));

    const hasCash = await accountOfType(connection, userId, "cash");

    const lines = extractMpesaLines(text).map((row) => ({
      ...row,
      category: categories.get(row.counterparty) ?? row.category,
      alreadyImported: row.isSpend && importedReceipts.has(row.receiptNo),
    }));

    return res.status(200).json({
      message: "PDF parsed successfully",
      // With a Cash account a withdrawal is a move, not spending.
      transactions: lines.map((row) => ({
        ...row,
        isSpend: row.isSpend && !(hasCash && row.kind === "withdrawal"),
      })),
      xray: buildXray(lines),
    });
  } catch (error) {
    if (error.name === "PasswordException") {
      const incorrect = error.code === PasswordResponses.INCORRECT_PASSWORD;
      return res.status(422).json({
        code: incorrect ? "PASSWORD_INCORRECT" : "PASSWORD_REQUIRED",
        message: incorrect
          ? "That password didn't work. Check the SMS from Safaricom."
          : "This statement is password protected. Enter its password to continue.",
      });
    }

    console.error("MPESA PDF ERROR:", error.message);
    return res.status(422).json({
      message: "We couldn't read this PDF. Check it's a full M-Pesa statement.",
    });
  }
};

// One "M-Pesa fees" expense per month, recalculated from the saved rows so a
// second statement for the same month updates it instead of adding another.
const saveMonthlyFees = async (db, userId, transactions, accountId) => {
  const periods = [
    ...new Set(
      transactions
        .filter((row) => row.kind === "fee")
        .map((row) => row.occurredAt.slice(0, 7))
    ),
  ];
  if (periods.length === 0) return;

  const [months] = await db.query(
    `SELECT DATE_FORMAT(occurred_at, '%Y-%m') AS period,
      SUM(withdrawn) AS total,
      COUNT(*) AS charges,
      DATE_FORMAT(MAX(occurred_at), '%Y-%m-%d') AS lastDate
    FROM mpesa_transactions
    WHERE user_id = ? AND kind = 'fee'
      AND DATE_FORMAT(occurred_at, '%Y-%m') IN (?)
    GROUP BY period`,
    [userId, periods]
  );

  await db.query(
    `INSERT INTO expense
    (amount, category, date_created, month, user_id, subcategories, budgeted, budget_id, description, merchant, receipt_no, source, account_id)
    VALUES ?
    ON DUPLICATE KEY UPDATE status = 'active', amount = VALUES(amount),
      date_created = VALUES(date_created), subcategories = VALUES(subcategories)`,
    [
      months.map(({ period, total, charges, lastDate }) => [
        total,
        "taxes",
        lastDate,
        new Date(lastDate).toLocaleString("default", { month: "long" }),
        userId,
        JSON.stringify([
          { name: `M-Pesa fees (${charges} charges)`, amount: Number(total) },
        ]),
        0,
        null,
        "M-Pesa transaction fees",
        "M-Pesa",
        `FEES-${period}`,
        "mpesa",
        accountId,
      ]),
    ]
  );
};

export const saveMpesaTransactions = async (req, res) => {
  // Masked again here, whatever the client sends.
  const transactions = req.body.transactions.map((row) => ({
    ...row,
    details: maskPhones(row.details),
    counterparty: maskPhones(row.counterparty),
  }));
  const userId = parseInt(req.user.userId);
  const db = await connection.getConnection();
  try {
    const mpesaId = await accountOfType(db, userId, "mpesa");
    const cashId = await accountOfType(db, userId, "cash");
    const [moved] = await db.execute(
      "SELECT receipt_no FROM mpesa_transactions WHERE user_id = ? AND transfer_status = 'transfer'",
      [userId]
    );
    const transfers = new Set(moved.map((row) => row.receipt_no));
    const isCashMove = (row) => cashId && mpesaId && row.kind === "withdrawal" && row.withdrawn > 0;
    const spends = transactions.filter((row) => row.save && !transfers.has(row.receiptNo) && !isCashMove(row));

    await db.beginTransaction();

    await db.query(
      `INSERT IGNORE INTO mpesa_transactions
      (user_id, receipt_no, occurred_at, details, kind, counterparty, paid_in, withdrawn, balance)
      VALUES ?`,
      [
        transactions.map((row) => [
          userId,
          row.receiptNo,
          row.occurredAt,
          row.details,
          row.kind,
          row.counterparty ?? null,
          row.paidIn,
          row.withdrawn,
          row.balance ?? null,
        ]),
      ]
    );

    if (spends.length > 0) {
      await db.query(
        `INSERT INTO expense
        (amount, category, date_created, month, user_id, subcategories, budgeted, budget_id, description, merchant, receipt_no, source, needs_review, account_id)
        VALUES ?
        ON DUPLICATE KEY UPDATE status = 'active', category = VALUES(category), account_id = VALUES(account_id),
          source = VALUES(source), description = VALUES(description)`,
        [
          spends.map((row) => {
            const date = row.occurredAt.slice(0, 10);
            const name = row.counterparty || row.details;
            return [
              row.withdrawn,
              row.category,
              date,
              new Date(date).toLocaleString("default", { month: "long" }),
              userId,
              JSON.stringify([{ name: name.slice(0, 100), amount: row.withdrawn }]),
              0,
              null,
              row.details,
              row.counterparty ?? null,
              row.receiptNo,
              "mpesa",
              row.category === "miscellaneous" ? 1 : 0,
              mpesaId,
            ];
          }),
        ]
      );

      const merchants = spends.filter((row) => row.counterparty);
      if (merchants.length > 0) {
        await db.query(
          `INSERT INTO merchant_categories (user_id, merchant, category)
          VALUES ?
          ON DUPLICATE KEY UPDATE category = VALUES(category)`,
          [merchants.map((row) => [userId, row.counterparty, row.category])]
        );
        await recordRealPayments(
          db,
          userId,
          merchants.map((row) => ({
            name: row.counterparty,
            date: row.occurredAt.slice(0, 10),
            amount: Number(row.withdrawn),
          }))
        );
      }
    }

    await saveMonthlyFees(db, userId, transactions, mpesaId);

    const cashMoves = transactions.filter(isCashMove);
    if (cashMoves.length > 0) {
      await db.query(
        `INSERT IGNORE INTO account_transfers (user_id, from_account_id, to_account_id, amount, moved_on, receipt_no)
        VALUES ?`,
        [cashMoves.map((row) => [userId, mpesaId, cashId, row.withdrawn, row.occurredAt.slice(0, 10), row.receiptNo])]
      );
    }
    if (mpesaId) await syncStatementBalances(db, userId, mpesaId);

    await db.commit();
    await refreshUserBudgets(userId, req.user.email);
    return res.status(200).json({
      message: `Saved ${spends.length} expense(s)`,
      savedCount: spends.length,
    });
  } catch (error) {
    await db.rollback();
    console.error("DB MULTI INSERT ERROR:", error.message);
    return res.status(500).json({
      message: "Failed to save M-Pesa transactions",
    });
  } finally {
    db.release();
  }
};

export const createReceiptExpense = async (req, res) => {
  let worker = null;

  try {
    if (!req.file) {
      return res.status(400).json({ message: "No receipt image uploaded" });
    }

    // Configure Tesseract with better options
    const {
      data: { text },
    } = await Tesseract.recognize(req.file.buffer, "eng", {
      // Add configuration for better performance
      tessedit_pageseg_mode: "6", // Uniform block of text
      tessedit_char_whitelist:
        "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz .-@:/$%&()#,KESH",
      // Optimize for receipt processing
      tessedit_ocr_engine_mode: "3", // Default + LSTM
    });

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        message:
          "No text could be extracted from the image. Please try a clearer image.",
      });
    }

    // Extract structured data from OCR text
    const extractedData = extractReceiptData(text);

    return res.status(200).json({
      message: "Receipt processed successfully",
      extractedData: {
        amount: extractedData.amount,
        date: extractedData.date,
        description: extractedData.description,
        merchant: extractedData.merchant,
        category: "miscellaneous",
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
      merchant,
      budgeted,
      budgetId,
      accountId,
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
    const chosenBudget = await ownBudgetId(userId, budgetId);

    const sql = `
      INSERT INTO expense 
      (amount, category, date_created, month, user_id, subcategories, budgeted, budget_id, description, merchant, source, needs_review, account_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'receipt', ?, ?)
    `;

    const values = [
      parseFloat(amount),
      category,
      date,
      month,
      userId,
      JSON.stringify([
        { name: merchant || description, amount: parseFloat(amount) },
      ]),
      budgeted || chosenBudget ? 1 : 0,
      chosenBudget,
      description,
      merchant || null,
      category === "miscellaneous" ? 1 : 0,
      await chooseAccount(connection, userId, accountId),
    ];

    const [response] = await connection.query(sql, values);
    if (merchant && category !== "miscellaneous") {
      await connection.execute(
        `INSERT INTO merchant_categories (user_id, merchant, category) VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE category = VALUES(category)`,
        [userId, merchant, category]
      );
    }
    if (merchant) {
      await recordRealPayments(connection, userId, [
        { name: merchant, date: String(date).slice(0, 10), amount: parseFloat(amount) },
      ]);
    }
    await refreshUserBudgets(userId, req.user.email);

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
