import { apiFetchJson } from '@/lib/client/api-fetch';
import type { MessageMetadata } from '@/types/message-kind';
import type { UIMessage } from 'ai';

const PAGE_SIZE = 10;

/** 会话历史消息；METADATA 与 AI SDK UIMessage 对齐。 */
export interface HistoryMessage<METADATA = MessageMetadata> extends UIMessage<METADATA> {
  createdAt?: string;
  metadata: METADATA;
}

export interface MessageHistoryPage {
  messages: HistoryMessage[];
  hasMore: boolean;
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
