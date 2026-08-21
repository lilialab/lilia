import type { CharacterSummary } from '@/client-api/characters';
import { apiFetchJson } from '@/lib/client/api-fetch';

export interface ContactSummary extends CharacterSummary {
  createdAt: string;
}

export interface ContactSession {
  sessionId: string;
  characterId: string;
  slug: string;
  /** 服务端仍在生成助手回复（含断线后台续跑） */
  isGenerating: boolean;
}

/** 拉取我的 AI 通讯录。 */
export async function fetchContacts(): Promise<ContactSummary[]> {
  const data = await apiFetchJson<{ contacts: ContactSummary[] }>('/api/contacts');
  return data.contacts;
}

/** 添加 AI 好友（幂等）。 */
export async function addContact(characterId: string): Promise<ContactSummary> {
  const data = await apiFetchJson<{ contact: ContactSummary }>('/api/contacts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ characterId }),
  });
  return data.contact;
}

/** 获取或创建与已添加角色的会话。 */
export async function fetchContactSession(characterId: string): Promise<ContactSession> {
  return apiFetchJson<ContactSession>(`/api/contacts/${characterId}/session`);
}

/** 删除 AI 好友（同时删除对应会话与聊天记录）。 */
export async function removeContact(characterId: string): Promise<void> {
  await apiFetchJson<{ ok: boolean }>(`/api/contacts/${characterId}`, {
    method: 'DELETE',
  });
}
