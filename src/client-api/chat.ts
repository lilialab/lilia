import { apiFetchJson } from '@/lib/client/api-fetch';

export interface ChatDailyTurnUsage {
  used: number;
  limit: number;
  remaining: number;
}

/** 查询当日对话配额用量（单聊 / 群聊共用）。 */
export async function fetchChatDailyTurnUsage(): Promise<ChatDailyTurnUsage> {
  return apiFetchJson<ChatDailyTurnUsage>('/api/chat/quota');
}
