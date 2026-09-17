import { API_ERROR_CODE } from '@/types/api-error';
import { z } from 'zod';

export const openGuestChatBodySchema = z.object({
  characterId: z
    .string({ error: API_ERROR_CODE.INVALID_REQUEST })
    .trim()
    .min(1, API_ERROR_CODE.INVALID_REQUEST),
});

export type OpenGuestChatBody = z.infer<typeof openGuestChatBodySchema>;
