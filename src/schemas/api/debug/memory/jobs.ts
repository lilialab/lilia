import { z } from 'zod';

export const getMemoryJobQuerySchema = z.object({
  jobId: z.string().trim().min(1),
});

export type GetMemoryJobQuery = z.infer<typeof getMemoryJobQuerySchema>;
