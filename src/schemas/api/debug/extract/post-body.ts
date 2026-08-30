import { z } from 'zod';

export const extractMockMessageSchema = z.object({
  speaker: z.string().trim().min(1),
  text: z.string().min(1),
});

export const debugExtractPostBodySchema = z.object({
  characterSlug: z.string().trim().min(1),
  messages: z.array(extractMockMessageSchema).min(1),
});

export type DebugExtractPostBody = z.infer<typeof debugExtractPostBodySchema>;
