import { AppError } from '@/lib/server/app-error';
import { prisma } from '@/lib/server/prisma';
import {
  catalogCharacterDetailSelect,
  catalogCharacterSelect,
  readCharacterFormProfile,
  toCharacterCatalogItem,
} from './definition.utils';

/** 列出全部 AI 角色目录，并标记当前用户是否已添加、是否创建者。 */
export async function listCharacters(userId: string) {
  const [rows, contacts] = await Promise.all([
    prisma.character.findMany({
      select: catalogCharacterSelect,
      orderBy: { createdAt: 'asc' },
    }),
    prisma.userCharacter.findMany({
      where: { userId },
      select: { characterId: true },
    }),
  ]);
  const contactIds = new Set(contacts.map((row) => row.characterId));
  return rows.map((row) => ({
    ...toCharacterCatalogItem(row),
    isContact: contactIds.has(row.id),
    isOwner: row.ownerId === userId,
  }));
}

/** 按 id 取目录角色，并标记当前用户是否已添加、是否创建者；含可编辑人设字段。 */
export async function getCatalogCharacter(userId: string, characterId: string) {
  const row = await prisma.character.findUnique({
    where: { id: characterId },
    select: catalogCharacterDetailSelect,
  });
  if (!row) {
    throw AppError.notFound('角色不存在');
  }
  const contact = await prisma.userCharacter.findUnique({
    where: { userId_characterId: { userId, characterId } },
    select: { id: true },
  });
  return {
    ...toCharacterCatalogItem(row),
    ...readCharacterFormProfile(row.profile),
    isContact: contact !== null,
    isOwner: row.ownerId === userId,
  };
}
