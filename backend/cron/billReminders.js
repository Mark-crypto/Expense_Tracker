import cron from "node-cron";
import { runBillJob } from "../utils/recurring.js";

const run = async () => {
  try {
    await runBillJob();
  } catch (error) {
    console.log("Error running bill job: ", error);
  }
};

cron.schedule("0 6 * * *", run, { timezone: "Africa/Nairobi" });

// Catches up on anything missed while the server was down.
run();
