import { API_ERROR_CODE } from '@/types/api-error';
import { z } from 'zod';

export const COMMENT_BODY_MAX_LENGTH = 500;

export const createCharacterCommentBodySchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, API_ERROR_CODE.INVALID_REQUEST)
    .max(COMMENT_BODY_MAX_LENGTH, API_ERROR_CODE.INVALID_REQUEST),
});

export type CreateCharacterCommentBody = z.infer<typeof createCharacterCommentBodySchema>;
