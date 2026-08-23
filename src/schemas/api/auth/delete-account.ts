import { passwordSchema } from '@/schemas/shared/password';
import { API_ERROR_CODE } from '@/types/api-error';
import { z } from 'zod';

export const deleteAccountBodySchema = z.object({
  currentPassword: passwordSchema,
  confirmDeletion: z.literal(true, {
    error: API_ERROR_CODE.DELETE_ACCOUNT_CONFIRMATION_REQUIRED,
  }),
});

export type DeleteAccountBody = z.infer<typeof deleteAccountBodySchema>;
