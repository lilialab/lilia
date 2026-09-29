import { accountSchema } from '@/schemas/shared/account';
import { z } from 'zod';

export const memoryExtractQuerySchema = z
  .object({
    account: accountSchema,
    sessionId: z.string().trim().min(1).optional(),
    groupSessionId: z.string().trim().min(1).optional(),
  })
  .refine(
    (data) => Boolean(data.sessionId) !== Boolean(data.groupSessionId),
    { message: '须且仅能指定 sessionId 或 groupSessionId 之一' },
  );

export type MemoryExtractQuery = z.infer<typeof memoryExtractQuerySchema>;
