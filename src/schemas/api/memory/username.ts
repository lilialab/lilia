import { z } from 'zod';
import { usernameSchema } from '@/schemas/shared/username';

export const memoryUsernameQuerySchema = z.object({
  username: usernameSchema,
});

export type MemoryUsernameQuery = z.infer<typeof memoryUsernameQuerySchema>;
