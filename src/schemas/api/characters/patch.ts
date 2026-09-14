import { type CreateCharacterBody, createCharacterBodySchema } from '@/schemas/api/characters/post';

export const updateCharacterBodySchema = createCharacterBodySchema.omit({ slug: true });

export type UpdateCharacterBody = Omit<CreateCharacterBody, 'slug'>;
