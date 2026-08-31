import { queryStringToBoolean } from '@/schemas/query';
import { usernameSchema } from '@/schemas/shared/username';
import { z } from 'zod';

const memoryTypeSchema = z.enum(['event', 'fact']);

export const listMemoryQuerySchema = z.object({
  username: usernameSchema,
  text: z.string().trim().optional(),
  type: memoryTypeSchema.optional(),
  isMaintained: z.enum(['true', 'false']).optional().transform(queryStringToBoolean),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListMemoryQuery = z.infer<typeof listMemoryQuerySchema>;
