import { z } from 'zod';

export const characterParamsSchema = z.object({
  characterId: z.string().trim().min(1),
});

export type CharacterParams = z.infer<typeof characterParamsSchema>;
