import { apiFetchJson } from '@/lib/client/api-fetch';

export interface GuestCatalogCharacter {
  id: string;
  slug: string;
  name: string;
  shortBio: string;
  hasAvatar: boolean;
  avatarUpdatedAt: string;
  isOfficial: boolean;
}

export interface GuestChatOpenSummary {
  characterId: string;
  slug: string;
  name: string;
  hasAvatar: boolean;
  avatarUpdatedAt: string;
  remaining: number;
  limit: number;
}

export interface GuestCredentialStatus {
  guestId: string;
  utcDay: string;
}

export interface IssueGuestCredentialResult extends GuestCredentialStatus {
  turnstileUsed: boolean;
}

/** 公开拉取访客试聊角色目录。 */
export async function fetchGuestCharacters(): Promise<GuestCatalogCharacter[]> {
  const data = await apiFetchJson<{ characters: GuestCatalogCharacter[] }>(
    '/api/guest/characters',
  );
  return data.characters;
}

/** 查询当日访客凭证是否有效。 */
export async function fetchGuestCredential(): Promise<GuestCredentialStatus> {
  return apiFetchJson<GuestCredentialStatus>('/api/guest/credential');
}

/** 签发或复用当日访客凭证。 */
export async function issueGuestCredential(
  turnstileToken?: string,
): Promise<IssueGuestCredentialResult> {
  return apiFetchJson<IssueGuestCredentialResult>('/api/guest/credential', {
    method: 'POST',
    json: turnstileToken ? { turnstileToken } : {},
  });
}

/** 打开访客试聊（服务端清空该 guest×角色历史）。 */
export async function openGuestChat(characterId: string): Promise<GuestChatOpenSummary> {
  return apiFetchJson<GuestChatOpenSummary>('/api/guest/sessions', {
    method: 'POST',
    json: { characterId },
  });
}
