import { z } from 'zod';
import { emptyToUndefined } from '@/schemas/query';

export const debugChromaGetQuerySchema = z.object({
  name: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  pageSize: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(1).default(10),
  ),
});

export type DebugChromaGetQuery = z.infer<typeof debugChromaGetQuerySchema>;
