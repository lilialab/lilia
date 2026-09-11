import { AppError } from '@/lib/server/app-error';
import { type JsonObject } from '@/utils/json-yaml';

export interface CharacterProfile {
  name: string;
  shortBio: string;
  persona: JsonObject;
}

export interface CharacterCatalogItem {
  id: string;
  slug: string;
  name: string;
  shortBio: string;
}

/** 解析角色人设 JSON：name / shortBio 给 UI，其余给人设 prompt。 */
export function parseCharacterProfile(raw: unknown): CharacterProfile {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    throw AppError.internal('角色人设须为 JSON 对象');
  }

  const { name, shortBio, ...persona } = raw as Record<string, unknown>;
  if (typeof name !== 'string' || name.trim() === '') {
    throw AppError.internal('角色人设缺少 name');
  }
  if (typeof shortBio !== 'string') {
    throw AppError.internal('角色人设缺少 shortBio');
  }

  return {
    name: name.trim(),
    shortBio,
    persona: persona as JsonObject,
  };
}

/** 解析角色 skill id 列表。 */
export function parseCharacterSkills(raw: unknown): string[] {
  if (!Array.isArray(raw) || raw.some((id) => typeof id !== 'string')) {
    throw AppError.internal('角色 skills 须为字符串数组');
  }
  return raw;
}

/** 目录/通讯录对外字段（不含人设正文）。 */
export function toCharacterCatalogItem(row: {
  id: string;
  slug: string;
  profile: unknown;
}): CharacterCatalogItem {
  const { name, shortBio } = parseCharacterProfile(row.profile);
  return { id: row.id, slug: row.slug, name, shortBio };
}
