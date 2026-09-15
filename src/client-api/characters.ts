import { apiFetchJson } from '@/lib/client/api-fetch';
import type { UpdateCharacterBody } from '@/schemas/api/characters/patch';

export { COMMENT_BODY_MAX_LENGTH } from '@/schemas/api/characters/comments-post';

export interface CharacterSummary {
  id: string;
  slug: string;
  name: string;
  shortBio: string;
  hasAvatar: boolean;
  avatarUpdatedAt: string;
}

export interface CatalogCharacter extends CharacterSummary {
  isContact: boolean;
  isOwner: boolean;
  isListed: boolean;
}

export interface CatalogCharacterDetail extends CatalogCharacter {
  gender: string;
  height: string | undefined;
  relation: string | undefined;
  personality: string[] | undefined;
}

export interface CharacterComment {
  id: string;
  body: string;
  createdAt: string;
  userId: string;
  nickname: string;
  hasAvatar: boolean;
  avatarUpdatedAt: string;
}

/** 拉取 AI 角色目录（含是否已添加）。 */
export async function fetchCharacters(): Promise<CatalogCharacter[]> {
  const data = await apiFetchJson<{ characters: CatalogCharacter[] }>('/api/characters');
  return data.characters;
}

/** 拉取单个目录角色（含是否已添加、可编辑人设）。 */
export async function fetchCharacter(characterId: string): Promise<CatalogCharacterDetail> {
  const data = await apiFetchJson<{ character: CatalogCharacterDetail }>(
    `/api/characters/${characterId}`,
  );
  return data.character;
}

/** 新建目录角色。 */
export async function createCharacter(input: {
  slug: string;
  name: string;
  shortBio?: string;
  gender: string;
  height?: string;
  relation?: string;
  personality?: string[];
  avatar?: File;
}): Promise<CharacterSummary> {
  const { avatar, ...body } = input;
  const data = await apiFetchJson<{ character: CharacterSummary }>('/api/characters', {
    method: 'POST',
    json: body,
  });
  if (!avatar) return data.character;
  return uploadCharacterAvatar(data.character.id, avatar);
}

/** 更新目录角色（不含账号名）。 */
export async function updateCharacter(
  characterId: string,
  input: UpdateCharacterBody,
): Promise<CharacterSummary> {
  const data = await apiFetchJson<{ character: CharacterSummary }>(
    `/api/characters/${encodeURIComponent(characterId)}`,
    {
      method: 'PATCH',
      json: input,
    },
  );
  return data.character;
}

/** 创建者上架或下架角色。 */
export async function setCharacterListed(
  characterId: string,
  isListed: boolean,
): Promise<CatalogCharacter> {
  const data = await apiFetchJson<{ character: CatalogCharacter }>(
    `/api/characters/${encodeURIComponent(characterId)}/listed`,
    {
      method: 'PATCH',
      json: { isListed },
    },
  );
  return data.character;
}

/** 上传角色头像。 */
export async function uploadCharacterAvatar(
  characterId: string,
  file: File,
): Promise<CharacterSummary> {
  const form = new FormData();
  form.append('file', file);
  const data = await apiFetchJson<{ character: CharacterSummary }>(
    `/api/characters/${encodeURIComponent(characterId)}/avatar`,
    { method: 'POST', body: form },
  );
  return data.character;
}

/** 拉取角色详情评论（新到旧）。 */
export async function fetchCharacterComments(characterId: string): Promise<CharacterComment[]> {
  const data = await apiFetchJson<{ comments: CharacterComment[] }>(
    `/api/characters/${characterId}/comments`,
  );
  return data.comments;
}

/** 发表角色详情评论。 */
export async function createCharacterComment(
  characterId: string,
  body: string,
): Promise<CharacterComment> {
  const data = await apiFetchJson<{ comment: CharacterComment }>(
    `/api/characters/${characterId}/comments`,
    {
      method: 'POST',
      json: { body },
    },
  );
  return data.comment;
}

/** 登录用户可读的角色头像地址（浏览器带 Cookie 拉字节）。 */
export function characterAvatarUrl(characterId: string, updatedAt: string): string {
  return `/api/characters/${encodeURIComponent(characterId)}/avatar?v=${
    encodeURIComponent(updatedAt)
  }`;
}
