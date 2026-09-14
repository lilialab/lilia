import { AppError } from '@/lib/server/app-error';
import { prisma } from '@/lib/server/prisma';
import { buildCreateCharacterProfile } from './create.utils';
import {
  assertCharacterOwner,
  catalogCharacterSelect,
  type CharacterCatalogItem,
  toCharacterCatalogItem,
} from './definition.utils';

/** 创建者更新展示/人设字段（不含账号名）。 */
export async function updateCharacter(
  userId: string,
  characterId: string,
  input: {
    name: string;
    shortBio?: string;
    gender: string;
    height?: string;
    relation?: string;
    personality?: string[];
  },
): Promise<CharacterCatalogItem> {
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
    data: {
      name: input.name,
      shortBio: input.shortBio ?? '',
      profile: buildCreateCharacterProfile({
        gender: input.gender,
        height: input.height,
        relation: input.relation,
        personality: input.personality,
      }),
    },
    select: catalogCharacterSelect,
  });

  return toCharacterCatalogItem(row);
}
