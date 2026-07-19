import { tool } from 'ai';
import { z } from 'zod';
import { searchUserMessages } from '@/services/chat/message-search.service';

/** 创建「检索用户聊天历史」tool；userId / characterSlug 由聊天流注入，仅查当前角色。 */
export function createSearchChatHistoryTool(userId: string, characterSlug: string) {
  return tool({
    description:
      '按时间范围检索当前用户与你之间的历史消息。用于回忆上下文窗口之外说过的内容；' +
      '返回每条消息的原始 parts JSON。',
    inputSchema: z.object({
      from: z
        .string()
        .trim()
        .optional()
        .describe('起始时间（含），ISO 8601，如 2026-07-01T00:00:00.000Z'),
      to: z
        .string()
        .trim()
        .optional()
        .describe('结束时间（含），ISO 8601，如 2026-07-18T23:59:59.999Z'),
      limit: z.number().int().min(1).max(20).optional().describe('最多返回条数，默认 10，最大 20'),
    }),
    execute: async ({ from, to, limit }) => {
      const results = await searchUserMessages({
        userId,
        characterSlug,
        from,
        to,
        limit,
      });
      return {
        count: results.length,
        results,
      };
    },
  });
}
