import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Provide a valid email"),
  password: z.string().min(8, "Password is at least 8 characters long"),
});
