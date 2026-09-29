import { accountSchema } from '@/schemas/shared/account';
import { passwordSchema } from '@/schemas/shared/password';
import { z } from 'zod';

export const loginBodySchema = z.object({
  account: accountSchema,
  password: passwordSchema,
});

export type LoginBody = z.infer<typeof loginBodySchema>;
