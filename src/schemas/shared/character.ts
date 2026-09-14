import { API_ERROR_CODE } from '@/types/api-error';
import { z } from 'zod';

/** 角色 slug：群 @ / 唯一账号名；仅字母数字下划线连字符。 */
export const characterSlugSchema = z
  .string({ error: API_ERROR_CODE.CHARACTER_SLUG_REQUIRED })
  .trim()
  .min(1, API_ERROR_CODE.CHARACTER_SLUG_REQUIRED)
  .max(32, API_ERROR_CODE.CHARACTER_SLUG_TOO_LONG)
  .regex(/^[a-zA-Z0-9_-]+$/, API_ERROR_CODE.CHARACTER_SLUG_INVALID);

/** 角色展示名。 */
export const characterNameSchema = z
  .string({ error: API_ERROR_CODE.CHARACTER_NAME_REQUIRED })
  .trim()
  .min(1, API_ERROR_CODE.CHARACTER_NAME_REQUIRED)
  .max(64, API_ERROR_CODE.CHARACTER_NAME_TOO_LONG);

export const PERSONALITY_MAX_ITEMS = 20;
export const PERSONALITY_ITEM_MAX_LENGTH = 64;
export const CHARACTER_SHORT_BIO_MAX_LENGTH = 200;
export const CHARACTER_GENDERS = ['female', 'male'] as const;
export const CHARACTER_HEIGHT_MIN = 1;
export const CHARACTER_HEIGHT_MAX = 300;

/** 角色性别：female / male。 */
export const characterGenderSchema = z
  .string({ error: API_ERROR_CODE.CHARACTER_GENDER_REQUIRED })
  .trim()
  .min(1, API_ERROR_CODE.CHARACTER_GENDER_REQUIRED)
  .refine(
    (value) => (CHARACTER_GENDERS as readonly string[]).includes(value),
    API_ERROR_CODE.CHARACTER_GENDER_INVALID,
  );
