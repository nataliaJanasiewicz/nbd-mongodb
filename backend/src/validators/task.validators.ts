import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(["todo", "in_progress", "done"]).optional(),
  category: z.string().optional(),
  priority: z.number().int().min(1).max(5).optional(),
  extra: z.record(z.string(), z.any()).optional()
});

export const updateTaskSchema = createTaskSchema.partial();
