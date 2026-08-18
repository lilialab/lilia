import { passwordSchema } from '@/schemas/shared/password';
import { usernameSchema } from '@/schemas/shared/username';
import { z } from 'zod';

export const loginBodySchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
});

export type LoginBody = z.infer<typeof loginBodySchema>;
