import { accountSchema } from '@/schemas/shared/account';
import { z } from 'zod';

export const memoryMaintainQuerySchema = z.object({
  account: accountSchema,
  characterId: z.string().trim().min(1),
});

export type MemoryMaintainQuery = z.infer<typeof memoryMaintainQuerySchema>;
