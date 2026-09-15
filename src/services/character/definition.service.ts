import type { Prisma } from '@/generated/prisma/client';
import { AppError } from '@/lib/server/app-error';
import { prisma } from '@/lib/server/prisma';
import { type JsonObject } from '@/utils/json-yaml';
import { parseCharacterProfile, parseCharacterSkills } from './definition.utils';

export const characterDefinitionSelect = {
  id: true,
  slug: true,
  name: true,
  shortBio: true,
  profile: true,
  skills: true,
  extract: true,
  avatarKey: true,
  updatedAt: true,
} satisfies Prisma.CharacterSelect;

type CharacterDefinitionRow = Prisma.CharacterGetPayload<{
  select: typeof characterDefinitionSelect;
}>;

export interface CharacterDefinition {
  id: string;
  slug: string;
  name: string;
  shortBio: string;
  persona: JsonObject;
  skills: string[];
  extract: string;
  hasAvatar: boolean;
  avatarUpdatedAt: string;
}

function mapCharacterDefinition(row: CharacterDefinitionRow): CharacterDefinition {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortBio: row.shortBio,
    persona: parseCharacterProfile(row.profile),
    skills: parseCharacterSkills(row.skills),
    extract: row.extract,
    hasAvatar: Boolean(row.avatarKey),
    avatarUpdatedAt: row.updatedAt.toISOString(),
  };
}

/** 按 id 加载角色定义（人设 / skills / extract）。 */
export async function getCharacterDefinition(characterId: string): Promise<CharacterDefinition> {
  const row = await prisma.character.findUnique({
    where: { id: characterId },
    select: characterDefinitionSelect,
  });
  if (!row) {
    throw AppError.notFound('角色不存在');
  }
  return mapCharacterDefinition(row);
}

/** 按 slug 加载角色定义。 */
export async function getCharacterDefinitionBySlug(slug: string): Promise<CharacterDefinition> {
  const row = await prisma.character.findUnique({
    where: { slug },
    select: characterDefinitionSelect,
  });
  if (!row) {
    throw AppError.notFound('角色不存在');
  }
  return mapCharacterDefinition(row);
}
