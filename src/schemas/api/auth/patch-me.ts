import { displayNameSchema } from '@/schemas/shared/display-name';
import { localeSchema } from '@/schemas/shared/locale';
import { z } from 'zod';

export const patchMeBodySchema = z.union([
  z.object({ locale: localeSchema }),
  z.object({ displayName: displayNameSchema }),
]);

export type PatchMeBody = z.infer<typeof patchMeBodySchema>;
