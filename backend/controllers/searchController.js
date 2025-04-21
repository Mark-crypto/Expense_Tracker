import connection from "../database.js";
import { createClient } from "redis";
import dotenv from "dotenv";
import { json } from "express";
dotenv.config();

const redisClient = createClient({ url: process.env.REDIS_URL });
await redisClient.connect();

export const expenseSearch = async (req, res) => {
  const searchQuery = req.query.q;
  if (!searchQuery)
    return res.status(404).json({ message: "No input was passed" });

  const cached = await redisClient.get(searchQuery);
  if (cached) return res.status(200).json(JSON.parse(cached));

  const [rows] = await connection.execute(
    "SELECT category FROM expense MATCH(category) AGAINST(? IN NATURAL LANGUAGE MODE) LIMIT 10",
    [searchQuery]
  );
  await redisClient.set(searchQuery, JSON.stringify(rows), { EX: 600 });
  res.status(200).json({ data: rows });
};

export const budgetSearch = async (req, res) => {
  const searchQuery = req.query.q;
  if (!searchQuery)
    return res.status(404).json({ message: "No input was passed" });

  const cached = await redisClient.get(searchQuery);
  if (cached) return res.status(200).json(json.parse(cached));

  const [rows] = await connection.execute(
    "SELECT name FROM budget MATCH(name) AGAINST(? IN NATURAL LANGUAGE MODE) LIMIT 10",
    [searchQuery]
  );

  await redisClient.set(searchQuery, json.stringify(rows), { EX: 600 });
  res.status(200).json({ data: rows });
};
