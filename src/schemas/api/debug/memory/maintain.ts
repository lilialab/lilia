import { usernameSchema } from '@/schemas/shared/username';
import { z } from 'zod';

export const memoryMaintainQuerySchema = z.object({
  username: usernameSchema,
  characterId: z.string().trim().min(1),
});

export type MemoryMaintainQuery = z.infer<typeof memoryMaintainQuerySchema>;
