import { timeZoneSchema } from '@/schemas/shared/time-zone';
import { z } from 'zod';

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
  timeZone: timeZoneSchema,
});

export type ChatPostBody = z.infer<typeof chatPostBodySchema>;
