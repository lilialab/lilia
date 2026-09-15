import { AppError } from '@/lib/server/app-error';
import { prisma } from '@/lib/server/prisma';
import { softDeleteSessionMessages } from '@/services/chat/message.service';
import { cancelMemoryExtract } from '@/services/memory/extract-queue.service';
import { isGenerationBusy } from '@/services/session/generation-lock.utils';
import { createSession } from '@/services/session/sessions.service';
import { API_ERROR_CODE } from '@/types/api-error';
import { catalogCharacterSelect, toCharacterCatalogItem } from './definition.utils';

/* -------------------------------------------------------------------------- */
/* Contacts                                                                   */
/* -------------------------------------------------------------------------- */

/** 列出用户已添加的 AI 通讯录。 */
export async function listContacts(userId: string) {
  const rows = await prisma.userCharacter.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
    select: {
      createdAt: true,
      character: { select: catalogCharacterSelect },
    },
  });

  return rows.map((row) => ({
    ...toCharacterCatalogItem(row.character),
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
    select: catalogCharacterSelect,
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
      character: { select: catalogCharacterSelect },
    },
  });

  if (existing) {
    return {
      ...toCharacterCatalogItem(existing.character),
      createdAt: existing.createdAt,
    };
  }

  if (!character.isListed) {
    throw AppError.notFound('角色不存在');
  }

  const created = await prisma.userCharacter.create({
    data: { userId, characterId },
    select: {
      createdAt: true,
      character: { select: catalogCharacterSelect },
    },
  });

  return {
    ...toCharacterCatalogItem(created.character),
    createdAt: created.createdAt,
  };
}

/**
 * 删除 AI 好友：移除通讯录；单聊消息与清空记录相同（软删），会话行保留。
 * 群成员、记忆、画像不受影响。
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
    await softDeleteSessionMessages(session.id);
  }

  await prisma.userCharacter.delete({
    where: {
      userId_characterId: { userId, characterId },
    },
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
    select: catalogCharacterSelect,
  });

  if (!character) {
    throw AppError.notFound('角色不存在');
  }

  const item = toCharacterCatalogItem(character);

  const existing = await prisma.chatSession.findUnique({
    where: {
      userId_characterId: { userId, characterId },
    },
    select: { id: true, generatingStartedAt: true },
  });

  if (existing) {
    return {
      sessionId: existing.id,
      characterId: item.id,
      slug: item.slug,
      name: item.name,
      isGenerating: isGenerationBusy(existing.generatingStartedAt),
    };
  }

  const session = await createSession(userId, characterId, item.slug);
  return {
    sessionId: session.id,
    characterId: item.id,
    slug: item.slug,
    name: item.name,
    isGenerating: false,
  };
}
