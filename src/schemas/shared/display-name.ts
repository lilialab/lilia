import { API_ERROR_CODE } from '@/types/api-error';
import { z } from 'zod';

export const displayNameSchema = z
  .string({ error: API_ERROR_CODE.DISPLAY_NAME_REQUIRED })
  .trim()
  .min(1, API_ERROR_CODE.DISPLAY_NAME_REQUIRED)
  .max(64, API_ERROR_CODE.DISPLAY_NAME_TOO_LONG);
