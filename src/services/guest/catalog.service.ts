import { env } from '@/lib/server/env';
import { prisma } from '@/lib/server/prisma';
import {
  assertCharacterActive,
  catalogCharacterSelect,
  toCharacterCatalogItem,
} from '@/services/character/definition.utils';

export type GuestCatalogCharacter = ReturnType<typeof toCharacterCatalogItem> & {
  isOfficial: boolean;
};

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
