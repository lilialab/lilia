import { z } from 'zod';

export const updateCharacterListedBodySchema = z.object({
  isListed: z.boolean(),
});

export type UpdateCharacterListedBody = z.infer<typeof updateCharacterListedBodySchema>;
