import { env } from '@/lib/server/env';
import { prisma } from '@/lib/server/prisma';
import { extractTextFromParts } from '@/lib/message-parts';
import { MESSAGE_KIND_TURN_CUE, type MessageMetadata } from '@/types/message-kind';
import type { InputJsonValue } from '@prisma/client/runtime/client';
import type { UIDataTypes, UIMessage } from 'ai';

export const PAGE_SIZE = 10;
export const CONTEXT_MESSAGE_LIMIT = env.CHAT_CONTEXT_MESSAGE_LIMIT;

export const activeMessageFilter = { isDeleted: false };

const LEADING_SPEAKER_LABELS = /^(?:\([a-zA-Z0-9_-]+\):\s*)+/;

/** 去掉正文开头已有的 (slug): 标签（防与上下文前缀叠写）。 */
function stripLeadingSpeakerLabels(text: string): string {
  return text.replace(LEADING_SPEAKER_LABELS, '').trimStart();
}

function mapGroupMessageRole(role: string): UIMessage['role'] {
  if (role === 'user' || role === 'assistant' || role === 'system') return role;
  return 'assistant';
}

function mapGroupMessageRow(row: {
  id: string;
  role: string;
  kind: string | null;
  parts: unknown;
  createdAt: Date;
  speakerCharacterId: string | null;
  speakerCharacter: { displayName: string; slug: string } | null;
}): {
  id: string;
  role: UIMessage['role'];
  parts: UIMessage['parts'];
  createdAt: string;
  metadata: MessageMetadata;
} {
  return {
    id: row.id,
    role: mapGroupMessageRole(row.role),
    // Prisma Json → UI parts；库内由写入路径保证形状
    parts: row.parts as UIMessage['parts'],
    createdAt: row.createdAt.toISOString(),
    metadata:
      row.role === 'assistant' && row.speakerCharacter && row.speakerCharacterId
        ? {
            kind: null,
            slug: row.speakerCharacter.slug,
            speakerDisplayName: row.speakerCharacter.displayName,
            speakerCharacterId: row.speakerCharacterId,
          }
        : {
            kind: row.kind,
            slug: null,
          },
  };
}

const groupMessageSelect = {
  id: true,
  role: true,
  kind: true,
  parts: true,
  createdAt: true,
  speakerCharacterId: true,
  speakerCharacter: { select: { displayName: true, slug: true } },
} as const;

/**
 * 分页拉取群聊历史消息，支持 before 游标向上翻页。
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
      createdAt: beforeCreatedAt ? { lt: beforeCreatedAt } : undefined,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: groupMessageSelect,
  });

  const rows = items.toReversed();
  const oldest = rows.at(0);
  const hasMore =
    rows.length === limit && oldest != null && (await hasOlderMessages(oldest.createdAt));

  return { messages: rows.map(mapGroupMessageRow), hasMore };
}

/**
 * 写入群聊用户消息并更新群会话时间（不触发 LLM）。
 * @param kind null/缺省为普通消息；turn_cue 为续聊触发语
 */
export async function createGroupUserMessage(
  groupSessionId: string,
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
 * 获取群聊最近 N 条消息，按时间正序；助手消息文本加 (slug): 前缀供模型区分说话人。
 */
export async function getGroupContextMessages(
  groupSessionId: string,
  limit = CONTEXT_MESSAGE_LIMIT,
): Promise<UIMessage[]> {
  const items = await prisma.message.findMany({
    where: { groupSessionId, ...activeMessageFilter },
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

    const slug = row.speakerCharacter?.slug ?? 'assistant';
    // 防御性后处理：库内应已是纯正文；strip 防残留标签与下方前缀叠写
    const text = stripLeadingSpeakerLabels(extractTextFromParts(row.parts));
    return {
      id: row.id,
      role,
      parts: [{ type: 'text' as const, text: `(${slug}): ${text}` }],
    };
  });
}

/**
 * 最近一条普通用户消息正文（排除 turn_cue，供 RAG）。
 */
export async function getLatestRealUserMessageText(groupSessionId: string): Promise<string> {
  const row = await prisma.message.findFirst({
    where: {
      groupSessionId,
      role: 'user',
      ...activeMessageFilter,
      OR: [{ kind: null }, { kind: { not: MESSAGE_KIND_TURN_CUE } }],
    },
    orderBy: { createdAt: 'desc' },
    select: { parts: true },
  });
  return row ? extractTextFromParts(row.parts) : '';
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
