import { API_ERROR_CODE } from '@/types/api-error';
import { z } from 'zod';

export const passwordSchema = z
  .string({ error: API_ERROR_CODE.PASSWORD_REQUIRED })
  .min(8, API_ERROR_CODE.PASSWORD_TOO_SHORT);
