import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const pool = mysql.createPool({
  host: process.env.HOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
});

const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log("Connected to database");
    connection.release();
  } catch (err) {
    console.error("Error connecting to database:", err);
  }
};
testConnection();

export default pool;
