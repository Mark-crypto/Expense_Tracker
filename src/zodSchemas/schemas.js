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
export const loginSchema = z.object({
  email: z.string().email("Provide a valid email"),
  password: z.string().min(8, "Password is at least 8 characters long"),
});

export const registerSchema = z.object({
  name: z.string().min(1, "Provide a valid name"),
  email: z.string().email("Provide a valid email"),
  password: z.string().min(8, "Password has to be at least 8 characters"),
  confirmPassword: z
    .string()
    .min(8, "Password has to be at least 8 characters"),
});
