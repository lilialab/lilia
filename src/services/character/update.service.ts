import { AppError } from '@/lib/server/app-error';
import { prisma } from '@/lib/server/prisma';
import { buildCreateCharacterProfile, mergeCharacterProfile } from './create.utils';
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
    shortBio: string;
    gender: string;
    age?: string;
    height?: string;
    occupation?: string;
    relation?: string;
    attitude?: string;
    personality?: string[];
    values?: string[];
    dislikes?: string[];
  },
): Promise<CharacterCatalogItem> {
  const existing = await prisma.character.findUnique({
    where: { id: characterId },
    select: { ownerId: true, profile: true },
  });
  if (!existing) {
    throw AppError.notFound('角色不存在');
  }
  assertCharacterOwner(existing.ownerId, userId);

  const row = await prisma.character.update({
    where: { id: characterId },
    data: {
      name: input.name,
      shortBio: input.shortBio,
      profile: mergeCharacterProfile(
        existing.profile,
        buildCreateCharacterProfile({
          gender: input.gender,
          age: input.age,
          height: input.height,
          occupation: input.occupation,
          relation: input.relation,
          attitude: input.attitude,
          personality: input.personality,
          values: input.values,
          dislikes: input.dislikes,
        }),
      ),
    },
    select: catalogCharacterSelect,
  });

  return toCharacterCatalogItem(row);
}
