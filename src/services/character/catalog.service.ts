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
import { isOfficialCharacter } from './official.service';

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
