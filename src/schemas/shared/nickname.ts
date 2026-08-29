import { API_ERROR_CODE } from '@/types/api-error';
import { z } from 'zod';

export const nicknameSchema = z
  .string({ error: API_ERROR_CODE.NICKNAME_REQUIRED })
  .trim()
  .min(1, API_ERROR_CODE.NICKNAME_REQUIRED)
  .max(64, API_ERROR_CODE.NICKNAME_TOO_LONG);
