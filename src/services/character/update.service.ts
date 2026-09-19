import { AppError } from '@/lib/server/app-error';
import { prisma } from '@/lib/server/prisma';
import { API_ERROR_CODE } from '@/types/api-error';
import { buildCreateCharacterProfile, mergeCharacterProfile } from './create.utils';
import {
  assertCharacterActive,
  assertCharacterOwner,
  catalogCharacterSelect,
  type CharacterCatalogItem,
  toCharacterCatalogItem,
} from './definition.utils';
import { isOfficialCharacter } from './official.service';

/** 创建者更新展示/人设字段（不含账号名）；官方角色人设由 seed 管，拒改。 */
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
    select: { ownerId: true, deletedAt: true, profile: true },
  });
  assertCharacterActive(existing);
  assertCharacterOwner(existing.ownerId, userId);

  if (await isOfficialCharacter(existing.ownerId)) {
    throw AppError.forbidden(
      '官方角色由角色库维护，请在 characters.json 中修改后重跑 seed',
      API_ERROR_CODE.CHARACTER_OFFICIAL_READONLY,
    );
  }

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
