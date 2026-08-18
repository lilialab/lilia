import { isValidIanaTimeZone } from '@/utils/timezone';
import { z } from 'zod';

export const timeZoneSchema = z
  .string()
  .trim()
  .min(1)
  .refine(isValidIanaTimeZone, { message: '无效的 IANA 时区' });
