import { groupCharacterIdsSchema } from '@/schemas/shared/group-character-ids';
import { z } from 'zod';

export const replaceGroupMembersBodySchema = z.object({
  characterIds: groupCharacterIdsSchema,
});

export type ReplaceGroupMembersBody = z.infer<typeof replaceGroupMembersBodySchema>;
