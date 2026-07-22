import { MESSAGE_KIND_TURN_CUE } from '@/types/message-kind';
import { z } from 'zod';

/** 与单聊一致：历史里可能含 reasoning 等；落库时只取最后一条的 text。 */
const groupChatMessagePartSchema = z.looseObject({
  type: z.string(),
  text: z.string().optional(),
});

/** 入参只约束 kind/slug；其余 metadata（展示字段等）可原样带上。 */
const groupChatInboundMetadataSchema = z.looseObject({
  kind: z.enum([MESSAGE_KIND_TURN_CUE]).nullable().optional(),
  slug: z.string().trim().min(1).nullable().optional(),
});

const groupChatMessageSchema = z.object({
  id: z.string().trim().min(1),
  role: z.enum(['system', 'user', 'assistant']),
  parts: z.array(groupChatMessagePartSchema).min(1),
  metadata: groupChatInboundMetadataSchema.optional(),
});

export const groupChatPostBodySchema = z.object({
  messages: z.array(groupChatMessageSchema).min(1),
});

export type GroupChatPostBody = z.infer<typeof groupChatPostBodySchema>;
