import { logger } from '@/lib/server/logger';
import { prisma } from '@/lib/server/prisma';

/* -------------------------------------------------------------------------- */
/* Types & constants                                                          */
/* -------------------------------------------------------------------------- */

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 20;

export type SearchedMessage = {
  messageId: string;
  sessionId: string;
  characterSlug: string;
  role: string;
  createdAt: string;
  parts: unknown;
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function parseOptionalDate(value: string | Date | undefined): Date | undefined {
  if (value === undefined) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

/** 组装 createdAt 区间；无起止时返回 undefined（Prisma 会忽略）。 */
function buildCreatedAtFilter(from?: Date, to?: Date): { gte?: Date; lte?: Date } | undefined {
  if (!from && !to) return undefined;

  const filter: { gte?: Date; lte?: Date } = {};
  if (from) filter.gte = from;
  if (to) filter.lte = to;
  return filter;
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * 按角色与时间范围检索当前用户的历史消息。
 * characterSlug 由调用方注入（skill 闭包），不由模型选择。
 */
export async function searchUserMessages(options: {
  userId: string;
  characterSlug: string;
  from?: string | Date;
  to?: string | Date;
  limit?: number;
}): Promise<SearchedMessage[]> {
  const characterSlug = options.characterSlug.trim();
  if (!characterSlug) {
    return [];
  }

  const from = parseOptionalDate(options.from);
  const to = parseOptionalDate(options.to);
  const limit = Math.min(Math.max(options.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
  const startedAt = Date.now();

  const rows = await prisma.message.findMany({
    where: {
      createdAt: buildCreatedAtFilter(from, to),
      session: {
        userId: options.userId,
        character: { slug: characterSlug },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      role: true,
      parts: true,
      createdAt: true,
      sessionId: true,
    },
  });

  logger.info({
    event: 'skills.searchChatHistory',
    userId: options.userId,
    characterSlug,
    from: from?.toISOString(),
    to: to?.toISOString(),
    limit,
    count: rows.length,
    durationMs: Date.now() - startedAt,
  });

  return rows.flatMap((row) => {
    if (!row.sessionId) return [];
    return [
      {
        messageId: row.id,
        sessionId: row.sessionId,
        characterSlug,
        role: row.role,
        createdAt: row.createdAt.toISOString(),
        parts: row.parts,
      },
    ];
  });
}
