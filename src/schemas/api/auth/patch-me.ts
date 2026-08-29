import { localeSchema } from '@/schemas/shared/locale';
import { nicknameSchema } from '@/schemas/shared/nickname';
import { z } from 'zod';

export const patchMeBodySchema = z.union([
  z.object({ locale: localeSchema }),
  z.object({ nickname: nicknameSchema }),
]);

export type PatchMeBody = z.infer<typeof patchMeBodySchema>;
