import { API_ERROR_CODE } from '@/types/api-error';
import { z } from 'zod';

export const putLlmConfigBodySchema = z.object({
  baseUrl: z.string().max(512, API_ERROR_CODE.INVALID_REQUEST),
  model: z.string().max(128, API_ERROR_CODE.INVALID_REQUEST),
  apiKey: z.string().max(512, API_ERROR_CODE.INVALID_REQUEST),
});

export type PutLlmConfigBody = z.infer<typeof putLlmConfigBodySchema>;
