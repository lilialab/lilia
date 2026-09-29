import { localeSchema } from '@/schemas/shared/locale';
import { timeZoneSchema } from '@/schemas/shared/time-zone';
import { turnstileTokenSchema } from '@/schemas/shared/turnstile';
import { z } from 'zod';

export const anonymousBodySchema = z.object({
  turnstileToken: turnstileTokenSchema,
  locale: localeSchema,
  timeZone: timeZoneSchema,
});

export type AnonymousBody = z.infer<typeof anonymousBodySchema>;
