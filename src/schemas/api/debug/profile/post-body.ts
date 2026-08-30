import { z } from 'zod';

const profileSnapshotBodySchema = z.object({
  communication_style: z.string().optional(),
  avoid_topics: z.array(z.string()).optional(),
});

const profileReferenceMemorySchema = z.object({
  text: z.string().trim().min(1),
  type: z.enum(['preference', 'fact']),
  confidence: z.number().min(0).max(1),
});

export const debugProfilePostBodySchema = z.object({
  characterSlug: z.string().trim().min(1),
  existing: profileSnapshotBodySchema,
  referenceMemories: z.array(profileReferenceMemorySchema),
});

export type DebugProfilePostBody = z.infer<typeof debugProfilePostBodySchema>;
