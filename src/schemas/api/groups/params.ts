import { z } from 'zod';

export const groupParamsSchema = z.object({
  id: z.string().trim().min(1),
});

export type GroupParams = z.infer<typeof groupParamsSchema>;
