import { z } from 'zod';

export const debugChromaDeleteQuerySchema = z.object({
  name: z.string().trim().min(1),
  action: z.enum(['reset']).optional(),
});

export type DebugChromaDeleteQuery = z.infer<typeof debugChromaDeleteQuerySchema>;
