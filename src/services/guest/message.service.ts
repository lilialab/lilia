import { env } from '@/lib/server/env';
import { prisma } from '@/lib/server/prisma';
import type { InputJsonValue } from '@prisma/client/runtime/client';
import type { UIDataTypes, UIMessage } from 'ai';

const CONTEXT_MESSAGE_LIMIT = env.CHAT_CONTEXT_MESSAGE_LIMIT;

function mapMessageRole(role: string): UIMessage['role'] {
  if (role === 'user' || role === 'assistant' || role === 'system') return role;
  return 'assistant';
}

/** 最近一条试聊消息时间（用于 runtime_context）。 */
export async function findLatestGuestMessageCreatedAt(
  guestId: string,
  characterId: string,
): Promise<Date | null> {
  const row = await prisma.guestTrialMessage.findFirst({
    where: { guestId, characterId },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  });
  return row?.createdAt ?? null;
}

/** 取最近 N 条试聊消息，时间正序，供 LLM 上下文。 */
export async function getGuestContextMessages(
  guestId: string,
  characterId: string,
  limit = CONTEXT_MESSAGE_LIMIT,
): Promise<UIMessage[]> {
  const items = await prisma.guestTrialMessage.findMany({
    where: { guestId, characterId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return items.toReversed().map((row) => ({
    id: row.id,
    role: mapMessageRole(row.role),
    parts: row.parts as UIMessage['parts'],
  }));
}

/** 写入一条试聊消息。 */
export async function createGuestTrialMessage(input: {
  guestId: string;
  characterId: string;
  role: string;
  parts: UIDataTypes[] | InputJsonValue;
  clientIp: string | null;
}): Promise<{ id: string }> {
  const row = await prisma.guestTrialMessage.create({
    data: {
      guestId: input.guestId,
      characterId: input.characterId,
      role: input.role,
      parts: input.parts as InputJsonValue,
      clientIp: input.clientIp,
    },
    select: { id: true },
  });
  return row;
}

/** 打开试聊时硬删该 guest×角色历史。 */
export async function clearGuestTrialMessages(
  guestId: string,
  characterId: string,
): Promise<void> {
  await prisma.guestTrialMessage.deleteMany({
    where: { guestId, characterId },
  });
}
