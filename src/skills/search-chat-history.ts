import { searchUserMessages } from '@/services/chat/message-search.service';
import { tool } from 'ai';
import { z } from 'zod';

/** 创建「检索用户聊天历史」tool；userId / characterSlug 由聊天流注入，仅查当前角色。 */
export function createSearchChatHistoryTool(userId: string, characterSlug: string) {
  return tool({
    description:
      'Search your 1:1 chat history with the current user. Does not include group chats. Use this to recall things outside the current thread. If from and to are omitted, returns the latest messages, newest first. Each result is original parts JSON.',
    inputSchema: z.object({
      from: z
        .string()
        .trim()
        .optional()
        .describe('Start of the time range (inclusive), ISO 8601, e.g. 2026-07-01T00:00:00.000Z'),
      to: z
        .string()
        .trim()
        .optional()
        .describe('End of the time range (inclusive), ISO 8601, e.g. 2026-07-18T23:59:59.999Z'),
      limit: z
        .number()
        .int()
        .min(1)
        .max(20)
        .optional()
        .describe('Max messages to return. Defaults to 10, max 20.'),
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
