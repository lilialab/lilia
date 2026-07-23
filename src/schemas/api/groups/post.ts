import { groupCharacterIdsSchema } from '@/schemas/shared/group-character-ids';
import { z } from 'zod';

export const createGroupBodySchema = z.object({
  title: z.string().trim().min(1),
  characterIds: groupCharacterIdsSchema,
});

export type CreateGroupBody = z.infer<typeof createGroupBodySchema>;
