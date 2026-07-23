import type { CharacterSummary } from '@/client-api/characters';
import type { HistoryMessage } from '@/client-api/sessions';
import { apiFetchJson } from '@/lib/client/api-fetch';
import type { MessageMetadata } from '@/types/message-kind';

const PAGE_SIZE = 10;

export type GroupMemberSummary = CharacterSummary;

export interface GroupDetail {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  members: GroupMemberSummary[];
}

export type GroupHistoryMessage = HistoryMessage<MessageMetadata>;

export interface GroupMessageHistoryPage {
  messages: GroupHistoryMessage[];
  hasMore: boolean;
}

/** 拉取当前用户的群列表。 */
export async function fetchGroups(): Promise<GroupDetail[]> {
  const data = await apiFetchJson<{ groups: GroupDetail[] }>('/api/groups');
  return data.groups;
}

/** 拉取群详情。 */
export async function fetchGroup(groupSessionId: string): Promise<GroupDetail> {
  const data = await apiFetchJson<{ group: GroupDetail }>(`/api/groups/${groupSessionId}`);
  return data.group;
}

/** 创建群聊。 */
export async function createGroup(options: {
  title: string;
  characterIds: string[];
}): Promise<GroupDetail> {
  const data = await apiFetchJson<{ group: GroupDetail }>('/api/groups', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options),
  });
  return data.group;
}

/** 硬删群聊（含消息与成员关系）。 */
export async function deleteGroup(groupSessionId: string): Promise<void> {
  await apiFetchJson<{ ok: boolean }>(`/api/groups/${groupSessionId}`, {
    method: 'DELETE',
  });
}

/** 分页拉取群聊历史。 */
export async function fetchGroupHistoryPage(
  groupSessionId: string,
  before?: string,
): Promise<GroupMessageHistoryPage> {
  const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
  if (before) {
    params.set('before', before);
  }

  return apiFetchJson<GroupMessageHistoryPage>(
    `/api/groups/${groupSessionId}/messages?${params.toString()}`,
  );
}
