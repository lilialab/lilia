import { z } from 'zod';

export const addContactBodySchema = z.object({
  characterId: z.string().trim().min(1),
});

export type AddContactBody = z.infer<typeof addContactBodySchema>;
