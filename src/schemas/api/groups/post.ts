import { z } from 'zod';

export const createGroupBodySchema = z.object({
  title: z.string().trim().min(1),
  characterIds: z
    .array(z.string().trim().min(1))
    .default([])
    .transform((ids) => [...new Set(ids)]),
});

export type CreateGroupBody = z.infer<typeof createGroupBodySchema>;
