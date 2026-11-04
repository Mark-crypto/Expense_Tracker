import { Router } from "express";
import {
  addIncome,
  addTransfer,
  answerQuestion,
  createAccount,
  deleteIncome,
  deleteTransfer,
  getAccounts,
  getPaySettings,
  removeAccount,
  savePaySettings,
  updateAccount,
  updateBalance,
} from "../controllers/accountsController.js";
import {
  validateAccount,
  validateAccountEdit,
  validateBalance,
  validateIncome,
  validatePaySettings,
  validateQuestion,
  validateTransfer,
} from "../middlewares/validate.js";
import { requirePin } from "../utils/security.js";

const router = Router();

// Balances and changes to accounts sit behind the PIN; everyday money in and moves don't.
router.get("/accounts", requirePin, getAccounts);
router.post("/accounts", validateAccount, createAccount);
router.get("/accounts/pay-settings", getPaySettings);
router.put("/accounts/pay-settings", validatePaySettings, savePaySettings);
router.post("/accounts/income", validateIncome, addIncome);
router.delete("/accounts/income/:id", deleteIncome);
router.post("/accounts/transfers", validateTransfer, addTransfer);
router.delete("/accounts/transfers/:id", deleteTransfer);
router.post("/accounts/questions/:id", validateQuestion, answerQuestion);
router.patch("/accounts/:id", requirePin, validateAccountEdit, updateAccount);
router.delete("/accounts/:id", requirePin, removeAccount);
router.post("/accounts/:id/balance", validateBalance, updateBalance);

export default router;
