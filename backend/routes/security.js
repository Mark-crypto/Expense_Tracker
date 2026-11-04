import { Router } from "express";
import {
  changePassword,
  getSecurity,
  removePin,
  resetPin,
  setPin,
  signOutOthers,
  verifyPin,
} from "../controllers/securityController.js";
import { deleteStatementData, exportData } from "../controllers/dataController.js";
import { validatePasswordChange, validatePin, validatePinReset, validateStatementDelete } from "../middlewares/validate.js";
import { loadSecurity, requirePin } from "../utils/security.js";

const router = Router();

// A first PIN can be set freely; changing one needs this device unlocked.
const pinChangeAllowed = async (req, res, next) => {
  const security = await loadSecurity(parseInt(req.user.userId));
  return security?.pin_hash ? requirePin(req, res, next) : next();
};

router.get("/security", getSecurity);
router.post("/security/pin", validatePin, pinChangeAllowed, setPin);
router.post("/security/pin/verify", validatePin, verifyPin);
router.post("/security/pin/reset", validatePinReset, resetPin);
router.delete("/security/pin", requirePin, removePin);
router.post("/security/password", validatePasswordChange, requirePin, changePassword);
router.post("/security/sign-out-others", signOutOthers);
router.get("/security/export", requirePin, exportData);
router.post("/security/delete-statement-data", validateStatementDelete, requirePin, deleteStatementData);

export default router;
