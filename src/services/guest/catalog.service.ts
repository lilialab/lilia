import { prisma } from '@/lib/server/prisma';
import {
  assertCharacterActive,
  catalogCharacterSelect,
  toCharacterCatalogItem,
} from '@/services/character/definition.utils';
import { isOfficialCharacter } from '@/services/character/official.service';

export type GuestCatalogCharacter = ReturnType<typeof toCharacterCatalogItem> & {
  isOfficial: boolean;
};

/** 访客试聊目录：未软删角色（无通讯录/创建者态）。 */
export async function listGuestCharacters(): Promise<GuestCatalogCharacter[]> {
  const rows = await prisma.character.findMany({
    where: { deletedAt: null },
    select: catalogCharacterSelect,
    orderBy: { createdAt: 'asc' },
  });
  return Promise.all(
    rows.map(async (row) => ({
      ...toCharacterCatalogItem(row),
      isOfficial: await isOfficialCharacter(row.ownerId),
    })),
  );
}

/** 访客试聊单角色摘要；已软删当不存在。 */
export async function getGuestCharacter(characterId: string): Promise<GuestCatalogCharacter> {
  const row = await prisma.character.findUnique({
    where: { id: characterId },
    select: catalogCharacterSelect,
  });
  assertCharacterActive(row);
  return {
    ...toCharacterCatalogItem(row),
    isOfficial: await isOfficialCharacter(row.ownerId),
  };
}
