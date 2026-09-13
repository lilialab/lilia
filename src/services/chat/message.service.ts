import { env } from '@/lib/server/env';
import { prisma } from '@/lib/server/prisma';
import { clearChatGeneration } from '@/services/session/generation-lock.service';
import { type MessageMetadata } from '@/types/message-kind';
import type { InputJsonValue } from '@prisma/client/runtime/client';
import type { UIDataTypes, UIMessage } from 'ai';

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

export const PAGE_SIZE = 10;
export const CONTEXT_MESSAGE_LIMIT = env.CHAT_CONTEXT_MESSAGE_LIMIT;

const activeMessageFilter = { isDeleted: false };

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/** 写入保证：助手必有 speakerCharacter，用户必有 speakerUser。 */
type HistoryRow = {
  id: string;
  role: string;
  parts: unknown;
  createdAt: Date;
  speakerCharacter: {
    id: string;
    slug: string;
    name: string;
    avatarKey: string | null;
    updatedAt: Date;
  };
  speakerUser: {
    id: string;
    nickname: string;
    avatarKey: string | null;
    updatedAt: Date;
  };
};

/** 将数据库消息行映射为前端历史消息格式。 */
function mapMessageRow(row: HistoryRow): {
  id: string;
  role: UIMessage['role'];
  parts: UIMessage['parts'];
  createdAt: string;
  metadata: MessageMetadata;
} {
  let metadata: MessageMetadata;
  if (row.role === 'assistant') {
    const { id, slug, name, avatarKey, updatedAt } = row.speakerCharacter;
    metadata = {
      kind: null,
      slug,
      name,
      speakerId: id,
      hasAvatar: Boolean(avatarKey),
      avatarUpdatedAt: updatedAt.toISOString(),
    };
  } else {
    const { id, nickname, avatarKey, updatedAt } = row.speakerUser;
    metadata = {
      kind: null,
      slug: null,
      name: nickname,
      speakerId: id,
      hasAvatar: Boolean(avatarKey),
      avatarUpdatedAt: updatedAt.toISOString(),
    };
  }

  return {
    id: row.id,
    role: row.role as UIMessage['role'],
    parts: row.parts as UIMessage['parts'],
    createdAt: row.createdAt.toISOString(),
    metadata,
  };
}

/* -------------------------------------------------------------------------- */
/* Read                                                                       */
/* -------------------------------------------------------------------------- */

/** 会话中最新一条未删除消息的时间；没有则 null。须在写入本轮用户消息之前调用。 */
export async function findLatestMessageCreatedAt(sessionId: string): Promise<Date | null> {
  const row = await prisma.message.findFirst({
    where: { sessionId, ...activeMessageFilter },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  });
  return row?.createdAt ?? null;
}

/**
 * 获取会话最近 N 条消息，按时间正序返回，供 LLM 上下文使用。
 * @param limit 条数上限，默认 CONTEXT_MESSAGE_LIMIT
 */
export async function getContextMessages(
  sessionId: string,
  limit = CONTEXT_MESSAGE_LIMIT,
): Promise<UIMessage[]> {
  const items = await prisma.message.findMany({
    where: { sessionId, ...activeMessageFilter },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return items.toReversed().map((row) => ({
    id: row.id,
    role: row.role as UIMessage['role'],
    parts: row.parts as UIMessage['parts'],
  }));
}

/**
 * 分页拉取会话历史消息，支持 before 游标向上翻页。
 * @param options.before 上一页最早消息的 id，不传则取最新一页
 */
export async function getHistoryPage(
  sessionId: string,
  options: { limit?: number; before?: string } = {},
) {
  const limit = options.limit ?? PAGE_SIZE;

  /** 判断指定时间之前是否还有更早的未删除消息。 */
  async function hasOlderMessages(oldestCreatedAt: Date) {
    const count = await prisma.message.count({
      where: {
        sessionId,
        ...activeMessageFilter,
        createdAt: { lt: oldestCreatedAt },
      },
    });
    return count > 0;
  }

  let beforeCreatedAt: Date | undefined;
  if (options.before) {
    const cursor = await prisma.message.findFirst({
      where: { id: options.before, sessionId, ...activeMessageFilter },
      select: { createdAt: true },
    });
    if (!cursor) {
      return { messages: [], hasMore: false };
    }
    beforeCreatedAt = cursor.createdAt;
  }

  const items = await prisma.message.findMany({
    where: {
      sessionId,
      ...activeMessageFilter,
      createdAt: beforeCreatedAt ? { lt: beforeCreatedAt } : undefined,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      role: true,
      parts: true,
      createdAt: true,
      speakerCharacter: {
        select: { id: true, slug: true, name: true, avatarKey: true, updatedAt: true },
      },
      speakerUser: { select: { id: true, nickname: true, avatarKey: true, updatedAt: true } },
    },
  });

  const rows = items.toReversed();
  const oldest = rows.at(0);
  const hasMore = rows.length === limit && oldest !== undefined
    && (await hasOlderMessages(oldest.createdAt));

  return { messages: rows.map((row) => mapMessageRow(row as HistoryRow)), hasMore };
}

/* -------------------------------------------------------------------------- */
/* Write                                                                      */
/* -------------------------------------------------------------------------- */

/** 软删除会话下全部未删除消息（设置 isDeleted）。 */
export async function softDeleteSessionMessages(sessionId: string) {
  const result = await prisma.message.updateMany({
    where: { sessionId, ...activeMessageFilter },
    data: { isDeleted: true },
  });
  await clearChatGeneration(sessionId);
  return result;
}

/**
 * 保存助手回复并更新会话时间（内部事务控制）
 */
export async function saveAssistantResponse(
  sessionId: string,
  speakerCharacterId: string,
  parts: UIDataTypes[],
) {
  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: {
        sessionId,
        role: 'assistant',
        speakerCharacterId,
        parts: parts as InputJsonValue,
      },
    }),
    prisma.chatSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() },
    }),
  ]);

  return { messageId: message.id };
}
