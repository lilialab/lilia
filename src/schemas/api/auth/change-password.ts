import { passwordSchema } from '@/schemas/shared/password';
import { API_ERROR_CODE } from '@/types/api-error';
import { z } from 'zod';

export const changePasswordBodySchema = z
  .object({
    currentPassword: passwordSchema,
    newPassword: passwordSchema,
    confirmNewPassword: passwordSchema,
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: API_ERROR_CODE.PASSWORD_MISMATCH,
    path: ['confirmNewPassword'],
  });

export type ChangePasswordBody = z.infer<typeof changePasswordBodySchema>;
