import { apiFetchJson } from '@/lib/client/api-fetch';

export { COMMENT_BODY_MAX_LENGTH } from '@/schemas/api/characters/comments-post';

export interface CharacterSummary {
  id: string;
  slug: string;
  name: string;
  shortBio: string;
}

export interface CatalogCharacter extends CharacterSummary {
  isContact: boolean;
}

export interface CharacterComment {
  id: string;
  body: string;
  createdAt: string;
  nickname: string;
}

/** 拉取 AI 角色目录（含是否已添加）。 */
export async function fetchCharacters(): Promise<CatalogCharacter[]> {
  const data = await apiFetchJson<{ characters: CatalogCharacter[] }>('/api/characters');
  return data.characters;
}

/** 拉取单个目录角色（含是否已添加）。 */
export async function fetchCharacter(characterId: string): Promise<CatalogCharacter> {
  const data = await apiFetchJson<{ character: CatalogCharacter }>(
    `/api/characters/${characterId}`,
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    },
  );
  return data.comment;
}
