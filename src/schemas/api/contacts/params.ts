import { z } from 'zod';

export const contactCharacterParamsSchema = z.object({
  characterId: z.string().trim().min(1),
});

export type ContactCharacterParams = z.infer<typeof contactCharacterParamsSchema>;
