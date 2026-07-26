import { usernameSchema } from '@/schemas/shared/username';
import { z } from 'zod';

export const memoryConsolidateQuerySchema = z
  .object({
    username: usernameSchema,
    sessionId: z.string().trim().min(1).optional(),
    groupSessionId: z.string().trim().min(1).optional(),
  })
  .refine(
    (data) => Boolean(data.sessionId) !== Boolean(data.groupSessionId),
    { message: '须且仅能指定 sessionId 或 groupSessionId 之一' },
  );

export type MemoryConsolidateQuery = z.infer<typeof memoryConsolidateQuerySchema>;
