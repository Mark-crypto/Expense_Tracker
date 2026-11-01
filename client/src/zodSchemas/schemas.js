import { z } from "zod";

export const budgetSchema = z.object({
  name: z.string().min(1, "Enter a valid budget name"),
  email: z.boolean(),
  subcategories: z
    .array(
      z.object({
        name: z.string().optional().or(z.literal("")),
        amount: z.number().optional(),
      })
    )
    .refine(
      (subs) => subs.length > 0 && subs.every((s) => s.name && s.amount),
      "Each subcategory must have a name and amount"
    ),
  timeLimit: z.boolean().optional(),
  startDate: z.date().optional().nullable(),
  endDate: z.date().optional().nullable(),
  category: z.string().min(1, "Choose a valid category"),
});

export const quickExpenseSchema = z
  .object({
    amount: z.number({ message: "Enter the amount" }).positive("Enter the amount"),
    merchant: z.string().trim().min(1, "Who did you pay?").max(150, "Use 150 characters or fewer"),
    category: z.string().min(1, "Choose a category"),
    date: z.string().min(1, "Choose a date"),
    items: z.array(z.object({ name: z.string().trim(), amount: z.unknown() })),
  })
  .refine((data) => data.items.every((item) => item.name && item.amount > 0), {
    message: "Each item needs a name and an amount",
    path: ["items"],
  });

export const loginSchema = z.object({
  email: z.string().email("Provide a valid email"),
  password: z.string().min(8, "Password is at least 8 characters long"),
});

export const registerSchema = z
  .object({
    name: z.string().min(1, "Provide a valid name"),
    goal: z.string().min(1, "Provide a valid goal"),
    age: z.number("Enter a valid age").min(1, "Enter a valid age"),
    occupation: z.string().min(1, "Provide a valid occupation"),
    email: z.string().email("Provide a valid email"),
    password: z.string().min(8, "Password has to be at least 8 characters"),
    confirmPassword: z
      .string()
      .min(8, "Password has to be at least 8 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const profileSchema = z.object({
  goal: z.string().min(5, "Provide a valid goal"),
  age: z
    .number("Enter a valid number")
    .min(1, "Enter a valid age")
    .max(100, "Enter a valid age"),
  occupation: z.string().min(5, "Provide a valid occupation"),
  email: z.string().email("Provide a valid email"),
  name: z.string().min(1, "Provide a valid name"),
});
