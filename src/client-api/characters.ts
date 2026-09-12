import { apiFetchJson } from '@/lib/client/api-fetch';

export interface CharacterSummary {
  id: string;
  slug: string;
  name: string;
  shortBio: string;
}

export interface CatalogCharacter extends CharacterSummary {
  isContact: boolean;
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
