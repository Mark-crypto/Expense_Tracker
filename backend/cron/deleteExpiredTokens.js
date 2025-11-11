import cron from "node-cron";
import connection from "../database.js";

cron.schedule("0 0 * * 0", async () => {
  try {
    const [results] = await connection.execute(
      `DELETE FROM refresh_tokens 
         WHERE expiry_at < NOW()`
    );
    if (results.affectedRows > 0) {
      console.log(
        `Delete Expired Tokens Cron: ${results.affectedRows} tokens deleted.`
      );
    }
  } catch (error) {
    console.log("Error during refresh token cleanup, ", error);
  }
});
