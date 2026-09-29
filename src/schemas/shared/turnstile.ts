import { API_ERROR_CODE } from '@/types/api-error';
import { z } from 'zod';

export const turnstileTokenSchema = z
  .string({ error: API_ERROR_CODE.TURNSTILE_TOKEN_REQUIRED })
  .trim()
  .min(1, API_ERROR_CODE.TURNSTILE_TOKEN_REQUIRED);
