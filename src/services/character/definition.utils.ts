import type { Prisma } from '@/generated/prisma/client';
import { AppError } from '@/lib/server/app-error';
import { API_ERROR_CODE } from '@/types/api-error';
import { type JsonObject } from '@/utils/json-yaml';

export interface CharacterCatalogItem {
  id: string;
  slug: string;
  name: string;
  shortBio: string;
  hasAvatar: boolean;
  avatarUpdatedAt: string;
}

export const catalogCharacterSelect = {
  id: true,
  slug: true,
  name: true,
  shortBio: true,
  avatarKey: true,
  ownerId: true,
  isListed: true,
  updatedAt: true,
} satisfies Prisma.CharacterSelect;

export type CatalogCharacterRow = Prisma.CharacterGetPayload<{
  select: typeof catalogCharacterSelect;
}>;

/** 探索详情 / 编辑回填：目录字段 + profile。 */
export const catalogCharacterDetailSelect = {
  ...catalogCharacterSelect,
  profile: true,
} satisfies Prisma.CharacterSelect;

export interface CharacterFormProfile {
  gender: string;
  height: string | undefined;
  relation: string | undefined;
  personality: string[] | undefined;
}

/** 解析人设 JSON：须为对象，且不含已升列的 name/shortBio。 */
export function parseCharacterProfile(raw: unknown): JsonObject {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    throw AppError.internal('角色人设须为 JSON 对象');
  }
  if ('name' in raw || 'shortBio' in raw) {
    throw AppError.internal('角色人设不应含 name/shortBio（已升列）');
  }
  return raw as JsonObject;
}

/** 从人设 JSON 读出编辑表单字段。 */
export function readCharacterFormProfile(raw: unknown): CharacterFormProfile {
  const profile = parseCharacterProfile(raw);
  const identityRaw = profile.identity;
  if (typeof identityRaw !== 'object' || identityRaw === null) {
    throw AppError.internal('角色人设须含 identity 对象');
  }
  const identity = identityRaw as JsonObject;

  const personalityRaw = profile.personality;
  const personality = Array.isArray(personalityRaw) ? personalityRaw as string[] : undefined;

  return {
    gender: typeof identity.gender === 'string' ? identity.gender : '',
    height: typeof identity.height === 'string' ? identity.height : undefined,
    relation: typeof identity.relation === 'string' ? identity.relation : undefined,
    personality,
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
export function toCharacterCatalogItem(row: CatalogCharacterRow): CharacterCatalogItem {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortBio: row.shortBio,
    hasAvatar: Boolean(row.avatarKey),
    avatarUpdatedAt: row.updatedAt.toISOString(),
  };
}

/** 非创建者（含无主 / seed）不可改。 */
export function assertCharacterOwner(ownerId: string | null, userId: string): void {
  if (ownerId !== userId) {
    throw AppError.forbidden('只有创建者可以修改', API_ERROR_CODE.CHARACTER_NOT_OWNER);
  }
}

/** 探索目录可见：已上架，或当前用户是创建者。 */
export function isExploreVisible(
  isListed: boolean,
  ownerId: string | null,
  userId: string,
): boolean {
  return isListed || ownerId === userId;
}
