import { AppError } from '@/lib/server/app-error';
import { prisma } from '@/lib/server/prisma';
import { buildCreateCharacterProfile } from '@/services/character/create.utils';
import {
  catalogCharacterSelect,
  type CharacterCatalogItem,
  toCharacterCatalogItem,
} from '@/services/character/definition.utils';
import { API_ERROR_CODE } from '@/types/api-error';

const DEFAULT_EXTRACT =
  'Also watch for:\n- Boundaries and sore spots: topics they clearly dislike or want avoided\n- People who matter to them, and how those relationships are going\n- Shared language with this character: nicknames, in-jokes, terms you both use';

/** 新建目录角色（全局可见；创建者不自动加好友）。 */
export async function createCharacter(
  ownerUserId: string,
  input: {
    slug: string;
    name: string;
    shortBio?: string;
    gender: string;
    height?: string;
    relation?: string;
    personality?: string[];
  },
): Promise<CharacterCatalogItem> {
  const existing = await prisma.character.findUnique({
    where: { slug: input.slug },
    select: { id: true },
  });
  if (existing) {
    throw AppError.badRequest('该账号名已被占用', API_ERROR_CODE.CHARACTER_SLUG_TAKEN);
  }

  const row = await prisma.character.create({
    data: {
      slug: input.slug,
      name: input.name,
      shortBio: input.shortBio ?? '',
      ownerId: ownerUserId,
      profile: buildCreateCharacterProfile({
        gender: input.gender,
        height: input.height,
        relation: input.relation,
        personality: input.personality,
      }),
      skills: [],
      extract: DEFAULT_EXTRACT,
    },
    select: catalogCharacterSelect,
  });

  return toCharacterCatalogItem(row);
}
