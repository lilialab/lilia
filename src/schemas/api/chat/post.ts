import { z } from 'zod';
import { normalizeClientTimeZone } from '@/utils/timezone';

const chatMessagePartSchema = z.looseObject({
  type: z.string(),
  text: z.string().optional(),
});

const chatMessageSchema = z.object({
  id: z.string().trim().min(1),
  role: z.enum(['system', 'user', 'assistant']),
  parts: z.array(chatMessagePartSchema).min(1),
  metadata: z.unknown().optional(),
});

export const chatPostBodySchema = z.object({
  sessionId: z.string().trim().min(1),
  messages: z.array(chatMessageSchema).min(1),
  clientTimeZone: z.string().trim().optional().transform(normalizeClientTimeZone),
});

export type ChatPostBody = z.infer<typeof chatPostBodySchema>;
