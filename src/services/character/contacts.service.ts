import { AppError } from '@/lib/server/app-error';
import { prisma } from '@/lib/server/prisma';
import { createSession } from '@/services/session/sessions.service';
import { cancelMemoryExtract } from '@/services/memory/extract-queue.service';

const characterSelect = {
  id: true,
  slug: true,
  displayName: true,
} as const;

/** 列出全部 AI 角色目录。 */
export async function listCharacters() {
  return prisma.character.findMany({
    select: characterSelect,
    orderBy: { createdAt: 'asc' },
  });
}

/** 列出用户已添加的 AI 通讯录。 */
export async function listContacts(userId: string) {
  const rows = await prisma.userCharacter.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
    select: {
      createdAt: true,
      character: { select: characterSelect },
    },
  });

  return rows.map((row) => ({
    id: row.character.id,
    slug: row.character.slug,
    displayName: row.character.displayName,
    createdAt: row.createdAt,
  }));
}

/** 校验用户已添加该角色；未添加时抛错。 */
export async function assertIsContact(userId: string, characterId: string): Promise<void> {
  const contact = await prisma.userCharacter.findUnique({
    where: {
      userId_characterId: { userId, characterId },
    },
    select: { id: true },
  });

  if (!contact) {
    throw AppError.badRequest('请先添加该 AI 好友');
  }
}

/**
 * 添加 AI 好友（幂等）
 * @returns 通讯录条目对应的角色信息
 */
export async function addContact(userId: string, characterId: string) {
  const character = await prisma.character.findUnique({
    where: { id: characterId },
    select: characterSelect,
  });

  if (!character) {
    throw AppError.notFound('角色不存在');
  }

  const existing = await prisma.userCharacter.findUnique({
    where: {
      userId_characterId: { userId, characterId },
    },
    select: {
      createdAt: true,
      character: { select: characterSelect },
    },
  });

  if (existing) {
    return {
      id: existing.character.id,
      slug: existing.character.slug,
      displayName: existing.character.displayName,
      createdAt: existing.createdAt,
    };
  }

  const created = await prisma.userCharacter.create({
    data: { userId, characterId },
    select: {
      createdAt: true,
      character: { select: characterSelect },
    },
  });

  return {
    id: created.character.id,
    slug: created.character.slug,
    displayName: created.character.displayName,
    createdAt: created.createdAt,
  };
}

/**
 * 删除 AI 好友：移除通讯录关系，并删除对应 ChatSession（消息 cascade）。
 * 已写入的用户记忆 / 画像不受影响。
 */
export async function removeContact(userId: string, characterId: string) {
  const existing = await prisma.userCharacter.findUnique({
    where: {
      userId_characterId: { userId, characterId },
    },
    select: { id: true },
  });

  if (!existing) {
    throw AppError.notFound('未添加该 AI 好友');
  }

  const session = await prisma.chatSession.findUnique({
    where: {
      userId_characterId: { userId, characterId },
    },
    select: { id: true },
  });

  if (session) {
    await cancelMemoryExtract(session.id);
  }

  await prisma.$transaction(async (tx) => {
    await tx.userCharacter.delete({
      where: {
        userId_characterId: { userId, characterId },
      },
    });

    if (session) {
      await tx.chatSession.delete({
        where: { id: session.id },
      });
    }
  });
}

/**
 * 获取或创建与已添加角色的单聊会话
 */
export async function getOrCreateContactSession(userId: string, characterId: string) {
  await assertIsContact(userId, characterId);

  const character = await prisma.character.findUnique({
    where: { id: characterId },
    select: characterSelect,
  });

  if (!character) {
    throw AppError.notFound('角色不存在');
  }

  const existing = await prisma.chatSession.findUnique({
    where: {
      userId_characterId: { userId, characterId },
    },
    select: { id: true },
  });

  if (existing) {
    return {
      sessionId: existing.id,
      characterId: character.id,
      displayName: character.displayName,
    };
  }

  const session = await createSession(userId, characterId, character.displayName);
  return {
    sessionId: session.id,
    characterId: character.id,
    displayName: character.displayName,
  };
}
