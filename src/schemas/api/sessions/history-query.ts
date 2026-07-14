import { z } from 'zod';
import { PAGE_SIZE } from '@/services/chat/message.service';

export const sessionHistoryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).default(PAGE_SIZE),
  before: z.string().trim().optional(),
});

export type SessionHistoryQuery = z.infer<typeof sessionHistoryQuerySchema>;
