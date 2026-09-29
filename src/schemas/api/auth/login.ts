import { accountSchema } from '@/schemas/shared/account';
import { passwordSchema } from '@/schemas/shared/password';
import { turnstileTokenSchema } from '@/schemas/shared/turnstile';
import { z } from 'zod';

export const loginBodySchema = z.object({
  account: accountSchema,
  password: passwordSchema,
  turnstileToken: turnstileTokenSchema,
});

export type LoginBody = z.infer<typeof loginBodySchema>;
