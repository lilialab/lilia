import { AppError } from '@/lib/server/app-error';
import { type JsonObject } from '@/utils/json-yaml';

export interface CharacterCatalogItem {
  id: string;
  slug: string;
  name: string;
  shortBio: string;
}

export const catalogCharacterSelect = {
  id: true,
  slug: true,
  name: true,
  shortBio: true,
} as const;

/** 解析人设 JSON：须为对象，且不含已升列的 name/shortBio。 */
export function parseCharacterProfile(raw: unknown): JsonObject {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    throw AppError.internal('角色人设须为 JSON 对象');
  }

  const persona = raw as Record<string, unknown>;
  if ('name' in persona || 'shortBio' in persona) {
    throw AppError.internal('角色人设不应含 name/shortBio（已升列）');
  }
  return persona as JsonObject;
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
  name: string;
  shortBio: string;
}): CharacterCatalogItem {
  return { id: row.id, slug: row.slug, name: row.name, shortBio: row.shortBio };
}
