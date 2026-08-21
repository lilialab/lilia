import { localeSchema } from '@/schemas/shared/locale';
import { passwordSchema } from '@/schemas/shared/password';
import { usernameSchema } from '@/schemas/shared/username';
import { API_ERROR_CODE } from '@/types/api-error';
import { z } from 'zod';

export const registerBodySchema = z
  .object({
    username: usernameSchema,
    displayName: z
      .string({ error: API_ERROR_CODE.DISPLAY_NAME_REQUIRED })
      .trim()
      .min(1, API_ERROR_CODE.DISPLAY_NAME_REQUIRED)
      .max(64, API_ERROR_CODE.DISPLAY_NAME_TOO_LONG),
    password: passwordSchema,
    confirmPassword: passwordSchema,
    locale: localeSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: API_ERROR_CODE.PASSWORD_MISMATCH,
    path: ['confirmPassword'],
  });

export type RegisterBody = z.infer<typeof registerBodySchema>;
