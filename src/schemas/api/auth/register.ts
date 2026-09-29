import { accountSchema } from '@/schemas/shared/account';
import { localeSchema } from '@/schemas/shared/locale';
import { nicknameSchema } from '@/schemas/shared/nickname';
import { passwordSchema } from '@/schemas/shared/password';
import { timeZoneSchema } from '@/schemas/shared/time-zone';
import { turnstileTokenSchema } from '@/schemas/shared/turnstile';
import { API_ERROR_CODE } from '@/types/api-error';
import { z } from 'zod';

export const registerBodySchema = z
  .object({
    account: accountSchema,
    nickname: nicknameSchema,
    password: passwordSchema,
    confirmPassword: passwordSchema,
    turnstileToken: turnstileTokenSchema,
    locale: localeSchema,
    timeZone: timeZoneSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: API_ERROR_CODE.PASSWORD_MISMATCH,
    path: ['confirmPassword'],
  });

export type RegisterBody = z.infer<typeof registerBodySchema>;
