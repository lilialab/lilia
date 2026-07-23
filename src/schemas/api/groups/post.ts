import { z } from 'zod';

export const createGroupBodySchema = z.object({
  title: z.string().trim().min(1),
  characterIds: z
    .array(z.string().trim().min(1))
    .min(1)
    .transform((ids) => [...new Set(ids)]),
});

export type CreateGroupBody = z.infer<typeof createGroupBodySchema>;
