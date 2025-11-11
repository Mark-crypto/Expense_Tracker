import cron from "node-cron";
import connection from "../database.js";

cron.schedule("0 * * * *", async () => {
  try {
    const [results] = await connection.execute(
      `UPDATE budget 
        SET status = 'expired' 
        WHERE end_date < NOW() 
        AND status != 'expired' 
        AND has_time_limit = 1`
    );

    if (results.affectedRows > 0) {
      console.log(
        `Budget Expiration Cron: ${results.affectedRows} budgets expired.`
      );
    }
  } catch (error) {
    console.log("Error running cron expiration: ", error);
  }
});
