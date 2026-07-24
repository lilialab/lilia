import { usernameSchema } from '@/schemas/shared/username';
import { z } from 'zod';

export const memoryConsolidateQuerySchema = z.object({
  username: usernameSchema,
  sessionId: z.string().trim().min(1),
});

export type MemoryConsolidateQuery = z.infer<typeof memoryConsolidateQuerySchema>;
