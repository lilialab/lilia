import { AppError } from '@/lib/server/app-error';
import { env } from '@/lib/server/env';
import { prisma } from '@/lib/server/prisma';
import {
  assertCharacterOwner,
  catalogCharacterDetailSelect,
  type CatalogCharacterRow,
  catalogCharacterSelect,
  isExploreVisible,
  readCharacterFormProfile,
  toCharacterCatalogItem,
} from './definition.utils';

/** 官方角色：创建者是官方账号。进程内只查一次官方 userId。 */
let officialUserId: string | undefined;
async function isOfficialCharacter(ownerId: string | null): Promise<boolean> {
  if (ownerId === null) {
    return false;
  }
  if (!officialUserId) {
    const row = await prisma.user.findUnique({
      where: { username: env.OFFICIAL_USERNAME },
      select: { id: true },
    });
    officialUserId = row?.id;
  }
  return ownerId === officialUserId;
}

async function toCatalogCharacter(
  row: CatalogCharacterRow,
  userId: string,
  isContact: boolean,
) {
  return {
    ...toCharacterCatalogItem(row),
    isListed: row.isListed,
    isContact,
    isOwner: row.ownerId === userId,
    isOfficial: await isOfficialCharacter(row.ownerId),
  };
}

/** 列出探索目录：已上架，以及当前用户自己的下架角色。 */
export async function listCharacters(userId: string) {
  const [rows, contacts] = await Promise.all([
    prisma.character.findMany({
      where: {
        OR: [{ isListed: true }, { ownerId: userId }],
      },
      select: catalogCharacterSelect,
      orderBy: { createdAt: 'asc' },
    }),
    prisma.userCharacter.findMany({
      where: { userId },
      select: { characterId: true },
    }),
  ]);
  const contactIds = new Set(contacts.map((row) => row.characterId));
  return Promise.all(
    rows.map((row) => toCatalogCharacter(row, userId, contactIds.has(row.id))),
  );
}

/** 按 id 取目录角色；未上架且非创建者当不存在。 */
export async function getCatalogCharacter(userId: string, characterId: string) {
  const row = await prisma.character.findUnique({
    where: { id: characterId },
    select: catalogCharacterDetailSelect,
  });
  if (!row || !isExploreVisible(row.isListed, row.ownerId, userId)) {
    throw AppError.notFound('角色不存在');
  }
  const contact = await prisma.userCharacter.findUnique({
    where: { userId_characterId: { userId, characterId } },
    select: { id: true },
  });
  return {
    ...await toCatalogCharacter(row, userId, contact !== null),
    ...readCharacterFormProfile(row.profile),
  };
}

/** 创建者上架或下架角色。 */
export async function setCharacterListed(
  userId: string,
  characterId: string,
  isListed: boolean,
) {
  const existing = await prisma.character.findUnique({
    where: { id: characterId },
    select: { ownerId: true },
  });
  if (!existing) {
    throw AppError.notFound('角色不存在');
  }
  assertCharacterOwner(existing.ownerId, userId);

  const row = await prisma.character.update({
    where: { id: characterId },
    data: { isListed },
    select: catalogCharacterSelect,
  });
  return toCatalogCharacter(row, userId, false);
}
