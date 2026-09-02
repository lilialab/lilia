import { usernameSchema } from '@/schemas/shared/username';
import { z } from 'zod';

export const memoryProfileQuerySchema = z.object({
  username: usernameSchema,
  characterId: z.string().trim().min(1),
});

export type MemoryProfileQuery = z.infer<typeof memoryProfileQuerySchema>;
