import { z } from 'zod';

export const debugChromaPostBodySchema = z.object({
  name: z.string().trim().min(1),
  dataArray: z.array(z.string()).min(1),
});

export type DebugChromaPostBody = z.infer<typeof debugChromaPostBodySchema>;
