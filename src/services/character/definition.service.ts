import { AppError } from '@/lib/server/app-error';
import { prisma } from '@/lib/server/prisma';
import { type JsonObject } from '@/utils/json-yaml';
import { parseCharacterProfile, parseCharacterSkills } from './definition.utils';

export const characterDefinitionSelect = {
  id: true,
  slug: true,
  profile: true,
  skills: true,
  extract: true,
} as const;

export interface CharacterDefinition {
  id: string;
  slug: string;
  name: string;
  shortBio: string;
  persona: JsonObject;
  skills: string[];
  extract: string;
}

function mapCharacterDefinition(row: {
  id: string;
  slug: string;
  profile: unknown;
  skills: unknown;
  extract: string;
}): CharacterDefinition {
  const profile = parseCharacterProfile(row.profile);
  return {
    id: row.id,
    slug: row.slug,
    name: profile.name,
    shortBio: profile.shortBio,
    persona: profile.persona,
    skills: parseCharacterSkills(row.skills),
    extract: row.extract,
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
