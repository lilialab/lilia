import { displayNameSchema } from '@/schemas/shared/display-name';
import { localeSchema } from '@/schemas/shared/locale';
import { passwordSchema } from '@/schemas/shared/password';
import { usernameSchema } from '@/schemas/shared/username';
import { API_ERROR_CODE } from '@/types/api-error';
import { z } from 'zod';

export const registerBodySchema = z
  .object({
    username: usernameSchema,
    displayName: displayNameSchema,
    password: passwordSchema,
    confirmPassword: passwordSchema,
    turnstileToken: z
      .string({ error: API_ERROR_CODE.TURNSTILE_TOKEN_REQUIRED })
      .trim()
      .min(1, API_ERROR_CODE.TURNSTILE_TOKEN_REQUIRED),
    locale: localeSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: API_ERROR_CODE.PASSWORD_MISMATCH,
    path: ['confirmPassword'],
  });

export type RegisterBody = z.infer<typeof registerBodySchema>;
