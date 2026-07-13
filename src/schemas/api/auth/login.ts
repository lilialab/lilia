import { z } from 'zod';
import { usernameSchema } from '@/schemas/shared/username';

const passwordSchema = z.string().min(8, '密码至少 8 位');

export const loginBodySchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
});

export type LoginBody = z.infer<typeof loginBodySchema>;
