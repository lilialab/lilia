import { API_ERROR_CODE } from '@/types/api-error';
import { z } from 'zod';

export const usernameSchema = z
  .string({ error: API_ERROR_CODE.USERNAME_REQUIRED })
  .trim()
  .min(3, API_ERROR_CODE.USERNAME_TOO_SHORT)
  .max(32, API_ERROR_CODE.USERNAME_TOO_LONG)
  .regex(/^[a-zA-Z0-9]+$/, API_ERROR_CODE.USERNAME_INVALID);
