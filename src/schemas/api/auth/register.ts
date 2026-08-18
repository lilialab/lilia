import { usernameSchema } from '@/schemas/shared/username';
import { z } from 'zod';

export const registerBodySchema = z
  .object({
    username: usernameSchema,
    displayName: z.string().trim().min(1).max(64),
    password: z.string().min(8, '密码至少 8 位'),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '两次输入的密码不一致',
    path: ['confirmPassword'],
  });

export type RegisterBody = z.infer<typeof registerBodySchema>;
