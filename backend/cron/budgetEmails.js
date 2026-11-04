import cron from "node-cron";
import { flushBudgetEmails, sendWeeklyDigests } from "../utils/budgetStatus.js";

const safely = (name, job) => async () => {
  try {
    await job();
  } catch (error) {
    console.log(`Error running ${name}: `, error);
  }
};

cron.schedule("0 7 * * *", safely("held budget emails", () => flushBudgetEmails()), { timezone: "Africa/Nairobi" });
cron.schedule("0 8 * * 1", safely("weekly budget emails", () => sendWeeklyDigests()), { timezone: "Africa/Nairobi" });
