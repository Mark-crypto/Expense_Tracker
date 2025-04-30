import { z } from "zod";

export const budgetSchema = z.object({
  name: z.string().min(1, "Enter a valid budget name"),
  email: z.string().email("Provide a valid email"),
  amount: z.number().min(1, "Enter a valid number"),
  category: z.string().min(1, "Choose a valid category"),
});
