import { z } from 'zod';
import { queryStringToBoolean } from '@/schemas/query';

const memoryTypeSchema = z.enum(['preference', 'event', 'fact']);

export const listMemoryQuerySchema = z.object({
  userId: z.string().trim().default('default'),
  text: z.string().trim().optional(),
  type: memoryTypeSchema.optional(),
  isMaintained: z.enum(['true', 'false']).optional().transform(queryStringToBoolean),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListMemoryQuery = z.infer<typeof listMemoryQuerySchema>;
