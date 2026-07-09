import { z } from 'zod';
import { emptyToUndefined } from '@/schemas/query';
import { PAGE_SIZE } from '@/services/chat/message.service';

function parseHistoryLimit(val: unknown): number {
  if (val === undefined) return PAGE_SIZE;
  const n = Number(val);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : PAGE_SIZE;
}

export const sessionHistoryQuerySchema = z.object({
  limit: z.preprocess(emptyToUndefined, z.unknown().optional()).transform(parseHistoryLimit),
  before: z.preprocess(emptyToUndefined, z.string().trim().optional()),
});

export type SessionHistoryQuery = z.infer<typeof sessionHistoryQuerySchema>;
