import { z } from "zod";

export const budgetSchema = z.object({
  name: z.string().min(1, "Enter a valid budget name"),
  email: z.boolean(),
  amount: z.number("Enter a valid number").min(1, "Enter a valid number"),
  category: z.string().min(1, "Choose a valid category"),
});

export const expenseSchema = z.object({
  amount: z.number("Enter a valid number").min(1, "Enter a valid number"),
  category: z.string().min(1, "Choose a valid category"),
  date: z.date("Enter a valid date"),
});
