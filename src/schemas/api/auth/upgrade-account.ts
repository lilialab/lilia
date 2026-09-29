import { accountSchema } from '@/schemas/shared/account';
import { nicknameSchema } from '@/schemas/shared/nickname';
import { passwordSchema } from '@/schemas/shared/password';
import { API_ERROR_CODE } from '@/types/api-error';
import { z } from 'zod';

export const upgradeAccountBodySchema = z
  .object({
    account: accountSchema,
    nickname: nicknameSchema,
    password: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: API_ERROR_CODE.PASSWORD_MISMATCH,
    path: ['confirmPassword'],
  });

export type UpgradeAccountBody = z.infer<typeof upgradeAccountBodySchema>;
