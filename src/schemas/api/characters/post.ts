import {
  CHARACTER_HEIGHT_MAX,
  CHARACTER_HEIGHT_MIN,
  CHARACTER_SHORT_BIO_MAX_LENGTH,
  characterGenderSchema,
  characterNameSchema,
  characterSlugSchema,
  PERSONALITY_ITEM_MAX_LENGTH,
  PERSONALITY_MAX_ITEMS,
} from '@/schemas/shared/character';
import { API_ERROR_CODE } from '@/types/api-error';
import { z } from 'zod';

const optionalLine = z
  .string()
  .trim()
  .max(PERSONALITY_ITEM_MAX_LENGTH, API_ERROR_CODE.INVALID_REQUEST)
  .optional()
  .transform((value) => value || undefined);

const optionalShortBio = z
  .string()
  .trim()
  .max(CHARACTER_SHORT_BIO_MAX_LENGTH, API_ERROR_CODE.INVALID_REQUEST)
  .optional()
  .transform((value) => value || undefined);

const optionalHeight = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined)
  .refine((value) => {
    if (value === undefined) return true;
    if (!/^\d+$/.test(value)) return false;
    const n = Number(value);
    return n >= CHARACTER_HEIGHT_MIN && n <= CHARACTER_HEIGHT_MAX;
  }, API_ERROR_CODE.CHARACTER_HEIGHT_INVALID)
  .transform((value) => (value === undefined ? undefined : String(Number(value))));

const personalityItemSchema = z
  .string()
  .trim()
  .max(PERSONALITY_ITEM_MAX_LENGTH, API_ERROR_CODE.INVALID_REQUEST);

export const createCharacterBodySchema = z.object({
  slug: characterSlugSchema,
  name: characterNameSchema,
  shortBio: optionalShortBio,
  gender: characterGenderSchema,
  height: optionalHeight,
  relation: optionalLine,
  personality: z
    .array(personalityItemSchema)
    .max(PERSONALITY_MAX_ITEMS, API_ERROR_CODE.INVALID_REQUEST)
    .optional()
    .transform((items) => {
      const next = (items ?? []).filter((item) => item.length > 0);
      return next.length > 0 ? next : undefined;
    }),
});

export type CreateCharacterBody = z.infer<typeof createCharacterBodySchema>;
