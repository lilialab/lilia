import { z } from 'zod';
import { emptyToUndefined } from '@/schemas/query';

export const debugChromaDeleteQuerySchema = z.object({
  name: z.string().trim().min(1),
  action: z.preprocess(emptyToUndefined, z.enum(['reset']).optional()),
});

export type DebugChromaDeleteQuery = z.infer<typeof debugChromaDeleteQuerySchema>;
