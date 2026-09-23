import {
  CHARACTER_AGE_MAX,
  CHARACTER_AGE_MIN,
  CHARACTER_HEIGHT_MAX,
  CHARACTER_HEIGHT_MIN,
  characterGenderSchema,
  characterNameSchema,
  characterShortBioSchema,
  characterSlugSchema,
  PERSONALITY_ITEM_MAX_LENGTH,
  PERSONALITY_MAX_ITEMS,
  PROFILE_LINE_MAX_LENGTH,
  PROFILE_LIST_MAX_ITEMS,
  PROFILE_TEXT_MAX_LENGTH,
} from '@/schemas/shared/character';
import { API_ERROR_CODE } from '@/types/api-error';
import { z } from 'zod';

const optionalLine = z
  .string()
  .trim()
  .max(PERSONALITY_ITEM_MAX_LENGTH, API_ERROR_CODE.INVALID_REQUEST)
  .optional()
  .transform((value) => value || undefined);

const optionalAttitude = z
  .string()
  .trim()
  .max(PROFILE_TEXT_MAX_LENGTH, API_ERROR_CODE.INVALID_REQUEST)
  .optional()
  .transform((value) => value || undefined);

/**
 * 校验纯数字输入落在 min~max 内。入参始终是数字（表单数字键盘 + 范围校验）；
 * `unit` 用于把单位固化进存储值——身高存 "147cm" 而非 "147"，直接进 prompt 时不含糊。
 */
function optionalDigitInRange(min: number, max: number, error: string, unit = '') {
  return z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined)
    .refine((value) => {
      if (value === undefined) return true;
      if (!/^\d+$/.test(value)) return false;
      const n = Number(value);
      return n >= min && n <= max;
    }, error)
    .transform((value) => (value === undefined ? undefined : `${Number(value)}${unit}`));
}

function optionalStringList(itemMax: number, listMax: number) {
  return z
    .array(z.string().trim().max(itemMax, API_ERROR_CODE.INVALID_REQUEST))
    .max(listMax, API_ERROR_CODE.INVALID_REQUEST)
    .optional()
    .transform((items) => {
      const next = (items ?? []).filter((item) => item.length > 0);
      return next.length > 0 ? next : undefined;
    });
}

export const createCharacterBodySchema = z.object({
  slug: characterSlugSchema,
  name: characterNameSchema,
  shortBio: characterShortBioSchema,
  gender: characterGenderSchema,
  age: optionalDigitInRange(
    CHARACTER_AGE_MIN,
    CHARACTER_AGE_MAX,
    API_ERROR_CODE.CHARACTER_AGE_INVALID,
  ),
  height: optionalDigitInRange(
    CHARACTER_HEIGHT_MIN,
    CHARACTER_HEIGHT_MAX,
    API_ERROR_CODE.CHARACTER_HEIGHT_INVALID,
    'cm',
  ),
  occupation: optionalLine,
  relation: optionalLine,
  attitude: optionalAttitude,
  personality: optionalStringList(PERSONALITY_ITEM_MAX_LENGTH, PERSONALITY_MAX_ITEMS),
  values: optionalStringList(PROFILE_LINE_MAX_LENGTH, PROFILE_LIST_MAX_ITEMS),
  dislikes: optionalStringList(PROFILE_LINE_MAX_LENGTH, PROFILE_LIST_MAX_ITEMS),
});

export type CreateCharacterBody = z.infer<typeof createCharacterBodySchema>;
