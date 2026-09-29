import { queryStringToBoolean } from '@/schemas/query';
import { accountSchema } from '@/schemas/shared/account';
import { z } from 'zod';

const memoryTypeSchema = z.enum(['event', 'fact']);

export const listMemoryQuerySchema = z.object({
  account: accountSchema,
  text: z.string().trim().optional(),
  type: memoryTypeSchema.optional(),
  isMaintained: z.enum(['true', 'false']).optional().transform(queryStringToBoolean),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListMemoryQuery = z.infer<typeof listMemoryQuerySchema>;
