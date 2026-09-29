import { accountSchema } from '@/schemas/shared/account';
import { z } from 'zod';

export const memoryProfileQuerySchema = z.object({
  account: accountSchema,
  characterId: z.string().trim().min(1),
});

export type MemoryProfileQuery = z.infer<typeof memoryProfileQuerySchema>;
