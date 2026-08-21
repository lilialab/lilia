import { localeSchema } from '@/schemas/shared/locale';
import { z } from 'zod';

export const patchMeBodySchema = z.object({
  locale: localeSchema,
});

export type PatchMeBody = z.infer<typeof patchMeBodySchema>;
