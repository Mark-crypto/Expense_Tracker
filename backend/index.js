import app from "./app.js";
import "./cron/billReminders.js";
import "./cron/budgetExpiration.js";
import "./cron/budgetEmails.js";
import "./cron/deleteExpiredTokens.js";

const PORT = process.env.PORT || 5050;

//server
app.listen(PORT, () => {
  console.log(`Server is listening on PORT ${PORT}`);
});
