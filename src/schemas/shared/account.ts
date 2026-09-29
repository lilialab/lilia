import { API_ERROR_CODE } from '@/types/api-error';
import { z } from 'zod';

/** 账号标识：3–32 位字母或数字。 */
export const accountSchema = z
  .string({ error: API_ERROR_CODE.ACCOUNT_REQUIRED })
  .trim()
  .min(3, API_ERROR_CODE.ACCOUNT_TOO_SHORT)
  .max(32, API_ERROR_CODE.ACCOUNT_TOO_LONG)
  .regex(/^[a-zA-Z0-9]+$/, API_ERROR_CODE.ACCOUNT_INVALID);
