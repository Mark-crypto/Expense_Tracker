import { z } from "zod";

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
