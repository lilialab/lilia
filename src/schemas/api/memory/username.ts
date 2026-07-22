import { usernameSchema } from '@/schemas/shared/username';
import { z } from 'zod';

export const memoryUsernameQuerySchema = z.object({
  username: usernameSchema,
});

export type MemoryUsernameQuery = z.infer<typeof memoryUsernameQuerySchema>;
