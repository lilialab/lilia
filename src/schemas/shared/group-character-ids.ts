import { z } from 'zod';

/** 群成员 characterId 列表：至少 1 个，去重。 */
export const groupCharacterIdsSchema = z
  .array(z.string().trim().min(1))
  .min(1)
  .transform((ids) => [...new Set(ids)]);
