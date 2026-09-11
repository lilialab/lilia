import { env } from '@/lib/server/env';
import { prisma } from '@/lib/server/prisma';
import { parseCharacterProfile } from '@/services/character/definition.utils';
import { MESSAGE_KIND_TURN_CUE, type MessageMetadata } from '@/types/message-kind';
import { extractTextFromParts } from '@/utils/message-parts';
import type { InputJsonValue } from '@prisma/client/runtime/client';
import type { UIDataTypes, UIMessage } from 'ai';
import { stripLeadingSpeakerLabels } from './message.utils';

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

export const PAGE_SIZE = 10;
export const CONTEXT_MESSAGE_LIMIT = env.CHAT_CONTEXT_MESSAGE_LIMIT;

export const activeMessageFilter = { isDeleted: false };

/** 历史 / 上下文均不返回 turn_cue（编排用，非可读气泡）。 */
const excludeTurnCueFilter = {
  OR: [{ kind: null }, { kind: { not: MESSAGE_KIND_TURN_CUE } }],
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function mapGroupMessageRole(role: string): UIMessage['role'] {
  if (role === 'user' || role === 'assistant' || role === 'system') return role;
  return 'assistant';
}

/** 写入保证：助手必有 speakerCharacter，用户必有 speakerUser。 */
type GroupHistoryRow = {
  id: string;
  role: string;
  kind: string | null;
  parts: unknown;
  createdAt: Date;
  speakerCharacter: { slug: string; profile: unknown };
  speakerUser: { nickname: string };
};

function mapGroupMessageRow(row: GroupHistoryRow): {
  id: string;
  role: UIMessage['role'];
  parts: UIMessage['parts'];
  createdAt: string;
  metadata: MessageMetadata;
} {
  let metadata: MessageMetadata;
  if (row.role === 'assistant') {
    const { slug, profile } = row.speakerCharacter;
    metadata = {
      kind: null,
      slug,
      name: parseCharacterProfile(profile).name,
    };
  } else {
    metadata = {
      kind: row.kind,
      slug: null,
      name: row.speakerUser.nickname,
    };
  }

  return {
    id: row.id,
    role: mapGroupMessageRole(row.role),
    // Prisma Json → UI parts；库内由写入路径保证形状
    parts: row.parts as UIMessage['parts'],
    createdAt: row.createdAt.toISOString(),
    metadata,
  };
}

const groupMessageSelect = {
  id: true,
  role: true,
  kind: true,
  parts: true,
  createdAt: true,
  speakerCharacter: { select: { slug: true, profile: true } },
  speakerUser: { select: { nickname: true } },
} as const;

/* -------------------------------------------------------------------------- */
/* Read                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * 分页拉取群聊历史消息，支持 before 游标向上翻页；排除 turn_cue。
 * @param options.before 上一页最早消息的 id，不传则取最新一页
 */
export async function getGroupHistoryPage(
  groupSessionId: string,
  options: { limit?: number; before?: string } = {},
) {
  const limit = options.limit ?? PAGE_SIZE;

  async function hasOlderMessages(oldestCreatedAt: Date) {
    const count = await prisma.message.count({
      where: {
        groupSessionId,
        ...activeMessageFilter,
        ...excludeTurnCueFilter,
        createdAt: { lt: oldestCreatedAt },
      },
    });
    return count > 0;
  }

  let beforeCreatedAt: Date | undefined;
  if (options.before) {
    const cursor = await prisma.message.findFirst({
      where: { id: options.before, groupSessionId, ...activeMessageFilter },
      select: { createdAt: true },
    });
    if (!cursor) {
      return { messages: [], hasMore: false };
    }
    beforeCreatedAt = cursor.createdAt;
  }

  const items = await prisma.message.findMany({
    where: {
      groupSessionId,
      ...activeMessageFilter,
      ...excludeTurnCueFilter,
      createdAt: beforeCreatedAt ? { lt: beforeCreatedAt } : undefined,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: groupMessageSelect,
  });

  const rows = items.toReversed();
  const oldest = rows.at(0);
  const hasMore = rows.length === limit && oldest !== undefined
    && (await hasOlderMessages(oldest.createdAt));

  return { messages: rows.map((row) => mapGroupMessageRow(row as GroupHistoryRow)), hasMore };
}

/** 群会话中最新一条未删除消息的时间；没有则 null。须在写入本轮用户/turn_cue 之前调用。 */
export async function findLatestGroupMessageCreatedAt(
  groupSessionId: string,
): Promise<Date | null> {
  const row = await prisma.message.findFirst({
    where: { groupSessionId, ...activeMessageFilter },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  });
  return row?.createdAt ?? null;
}

/**
 * 获取群聊最近 N 条消息，按时间正序；排除 turn_cue；助手为纯正文 + metadata.slug（不加模型前缀）。
 */
export async function getGroupContextMessages(
  groupSessionId: string,
  limit = CONTEXT_MESSAGE_LIMIT,
): Promise<UIMessage[]> {
  const items = await prisma.message.findMany({
    where: {
      groupSessionId,
      ...activeMessageFilter,
      ...excludeTurnCueFilter,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      role: true,
      parts: true,
      speakerCharacter: { select: { slug: true } },
    },
  });

  return items.toReversed().map((row) => {
    const role = row.role as UIMessage['role'];
    if (role !== 'assistant') {
      return {
        id: row.id,
        role,
        parts: row.parts as UIMessage['parts'],
      };
    }

    // 防御性后处理：库内应已是纯正文；strip 防残留标签
    const text = stripLeadingSpeakerLabels(extractTextFromParts(row.parts));
    const slug = row.speakerCharacter?.slug ?? 'assistant';
    return {
      id: row.id,
      role,
      parts: [{ type: 'text' as const, text }],
      metadata: {
        kind: null,
        slug,
        name: null,
      } satisfies MessageMetadata,
    };
  });
}

/* -------------------------------------------------------------------------- */
/* Write                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * 写入群聊用户消息并更新群会话时间（不触发 LLM）。
 * @param speakerUserId 发言用户
 * @param kind null/缺省为普通消息；turn_cue 为续聊触发语
 */
export async function createGroupUserMessage(
  groupSessionId: string,
  speakerUserId: string,
  parts: unknown,
  kind: string | null = null,
): Promise<{ id: string }> {
  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: {
        groupSessionId,
        role: 'user',
        kind,
        speakerCharacterId: null,
        speakerUserId,
        parts: parts as InputJsonValue,
      },
    }),
    prisma.groupSession.update({
      where: { id: groupSessionId },
      data: { updatedAt: new Date() },
    }),
  ]);

  return { id: message.id };
}

/**
 * 保存群聊助手回复（含 speaker）并更新群会话时间。
 */
export async function saveGroupAssistantResponse(
  groupSessionId: string,
  speakerCharacterId: string,
  parts: UIDataTypes[],
) {
  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: {
        groupSessionId,
        role: 'assistant',
        speakerCharacterId,
        parts: parts as InputJsonValue,
      },
    }),
    prisma.groupSession.update({
      where: { id: groupSessionId },
      data: { updatedAt: new Date() },
    }),
  ]);

  return { messageId: message.id };
}
