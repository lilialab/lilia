import { env } from '@/lib/server/env';
import { prisma } from '@/lib/server/prisma';
import {
  assertCharacterActive,
  assertCharacterOwner,
  catalogCharacterDetailSelect,
  type CatalogCharacterRow,
  catalogCharacterSelect,
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
    isContact,
    isOwner: row.ownerId === userId,
    isOfficial: await isOfficialCharacter(row.ownerId),
  };
}

/** 列出探索目录：未软删角色。 */
export async function listCharacters(userId: string) {
  const [rows, contacts] = await Promise.all([
    prisma.character.findMany({
      where: { deletedAt: null },
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

/** 按 id 取目录角色；已软删当不存在。 */
export async function getCatalogCharacter(userId: string, characterId: string) {
  const row = await prisma.character.findUnique({
    where: { id: characterId },
    select: catalogCharacterDetailSelect,
  });
  assertCharacterActive(row);
  const contact = await prisma.userCharacter.findUnique({
    where: { userId_characterId: { userId, characterId } },
    select: { id: true },
  });
  return {
    ...await toCatalogCharacter(row, userId, contact !== null),
    ...readCharacterFormProfile(row.profile),
  };
}

/** 创建者软删角色（保留 ownerId；已添加用户仍可聊）。 */
export async function deleteCharacter(userId: string, characterId: string): Promise<void> {
  const existing = await prisma.character.findUnique({
    where: { id: characterId },
    select: { ownerId: true, deletedAt: true },
  });
  assertCharacterActive(existing);
  assertCharacterOwner(existing.ownerId, userId);

  await prisma.character.update({
    where: { id: characterId },
    data: { deletedAt: new Date() },
  });
}
