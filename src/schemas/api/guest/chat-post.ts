import { timeZoneSchema } from '@/schemas/shared/time-zone';
import { API_ERROR_CODE } from '@/types/api-error';
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

export const guestChatPostBodySchema = z.object({
  characterId: z
    .string({ error: API_ERROR_CODE.INVALID_REQUEST })
    .trim()
    .min(1, API_ERROR_CODE.INVALID_REQUEST),
  messages: z.array(chatMessageSchema).min(1),
  timeZone: timeZoneSchema,
});

export type GuestChatPostBody = z.infer<typeof guestChatPostBodySchema>;
