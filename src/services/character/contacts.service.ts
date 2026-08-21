import { AppError } from '@/lib/server/app-error';
import { prisma } from '@/lib/server/prisma';
import { DEFAULT_CHARACTER_ID } from '@/prompts/load';
import { cancelMemoryExtract } from '@/services/memory/extract-queue.service';
import { isGenerationBusy } from '@/services/session/generation-lock.utils';
import { createSession } from '@/services/session/sessions.service';
import { API_ERROR_CODE } from '@/types/api-error';

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const characterSelect = {
  id: true,
  slug: true,
} as const;

/* -------------------------------------------------------------------------- */
/* Character catalog                                                          */
/* -------------------------------------------------------------------------- */

/** 列出全部 AI 角色目录。 */
export async function listCharacters() {
  return prisma.character.findMany({
    select: characterSelect,
    orderBy: { createdAt: 'asc' },
  });
}

/* -------------------------------------------------------------------------- */
/* Contacts                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * 确保用户通讯录含默认角色 arbor（幂等）。
 * @returns arbor 的 characterId
 */
export async function ensureArborContact(userId: string): Promise<string> {
  const arbor = await prisma.character.findUnique({
    where: { slug: DEFAULT_CHARACTER_ID },
    select: { id: true },
  });

  if (!arbor) {
    throw AppError.internal('默认角色 arbor 不存在，请先执行 seed');
  }

  await addContact(userId, arbor.id);
  return arbor.id;
}

/** 列出用户已添加的 AI 通讯录（会懒补齐 arbor）。 */
export async function listContacts(userId: string) {
  await ensureArborContact(userId);

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
    throw AppError.badRequest('请先添加该 AI 好友', API_ERROR_CODE.CONTACT_REQUIRED);
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
    createdAt: created.createdAt,
  };
}

/**
 * 删除 AI 好友：移除通讯录关系，并删除对应 ChatSession（消息 cascade）。
 * 已写入的用户记忆 / 画像不受影响。默认角色 arbor 不可删。
 */
export async function removeContact(userId: string, characterId: string) {
  const character = await prisma.character.findUnique({
    where: { id: characterId },
    select: { slug: true },
  });

  if (character?.slug === DEFAULT_CHARACTER_ID) {
    throw AppError.badRequest('不能删除默认好友', API_ERROR_CODE.CANNOT_DELETE_DEFAULT_CONTACT);
  }

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

/* -------------------------------------------------------------------------- */
/* Contact sessions                                                           */
/* -------------------------------------------------------------------------- */

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
    select: { id: true, generatingStartedAt: true },
  });

  if (existing) {
    return {
      sessionId: existing.id,
      characterId: character.id,
      slug: character.slug,
      isGenerating: isGenerationBusy(existing.generatingStartedAt),
    };
  }

  const session = await createSession(userId, characterId, character.slug);
  return {
    sessionId: session.id,
    characterId: character.id,
    slug: character.slug,
    isGenerating: false,
  };
}
