import { z } from 'zod';
import { PAGE_SIZE } from '@/services/group/group-message.service';

export const groupHistoryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).default(PAGE_SIZE),
  before: z.string().trim().optional(),
});

export type GroupHistoryQuery = z.infer<typeof groupHistoryQuerySchema>;
