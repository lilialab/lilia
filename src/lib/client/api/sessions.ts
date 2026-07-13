import type { UIMessage } from 'ai';
import { apiFetchJson } from '@/lib/client/api-fetch';

const PAGE_SIZE = 10;

export interface HistoryMessage extends UIMessage {
  createdAt?: string;
}

export interface MessageHistoryPage {
  messages: HistoryMessage[];
  hasMore: boolean;
}

interface DefaultSession {
  id: string;
}

/** 获取当前用户的默认会话。 */
export async function fetchDefaultSession(): Promise<DefaultSession> {
  return apiFetchJson<DefaultSession>('/api/sessions/default');
}

/** 分页拉取会话历史消息。 */
export async function fetchHistoryPage(
  sessionId: string,
  before?: string,
): Promise<MessageHistoryPage> {
  const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
  if (before) {
    params.set('before', before);
  }

  try {
    return await apiFetchJson<MessageHistoryPage>(
      `/api/sessions/${sessionId}?${params.toString()}`,
    );
  } catch {
    return { messages: [], hasMore: false };
  }
}

/** 清空指定会话的全部消息。 */
export async function clearSessionMessages(sessionId: string): Promise<void> {
  await apiFetchJson<{ count: number }>(`/api/sessions/${sessionId}/messages`, {
    method: 'DELETE',
  });
}
