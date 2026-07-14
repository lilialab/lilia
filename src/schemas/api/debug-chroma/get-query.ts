import { z } from 'zod';

export const debugChromaGetQuerySchema = z.object({
  name: z.string().trim().optional(),
  pageSize: z.coerce.number().int().min(1).default(10),
});

export type DebugChromaGetQuery = z.infer<typeof debugChromaGetQuerySchema>;
