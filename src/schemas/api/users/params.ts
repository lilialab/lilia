import { z } from 'zod';

export const userParamsSchema = z.object({
  userId: z.string().trim().min(1),
});

export type UserParams = z.infer<typeof userParamsSchema>;
