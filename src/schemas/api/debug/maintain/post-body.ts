import { z } from 'zod';

const memoryTypeSchema = z.enum(['preference', 'event', 'fact']);

export const maintainClusterItemSchema = z.object({
  text: z.string().trim().min(1),
  type: memoryTypeSchema,
  confidence: z.number().min(0).max(1),
});

export const maintainClusterNeighborSchema = maintainClusterItemSchema.extend({
  distance: z.number(),
});

export const debugMaintainPostBodySchema = z.object({
  cursor: maintainClusterItemSchema,
  neighbors: z.array(maintainClusterNeighborSchema).min(1),
});

export type DebugMaintainPostBody = z.infer<typeof debugMaintainPostBodySchema>;
