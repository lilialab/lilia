import { apiFetchJson } from '@/lib/client/api-fetch';

export interface CharacterSummary {
  id: string;
  slug: string;
  name: string;
  shortBio: string;
}

/** 拉取 AI 角色目录。 */
export async function fetchCharacters(): Promise<CharacterSummary[]> {
  const data = await apiFetchJson<{ characters: CharacterSummary[] }>('/api/characters');
  return data.characters;
}
