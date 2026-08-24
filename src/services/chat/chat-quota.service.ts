import { env } from '@/lib/server/env';
import { assertRateLimits } from '@/lib/server/rate-limit';
import { API_ERROR_CODE } from '@/types/api-error';
import { formatUtcDate, secondsUntilNextUtcMidnight } from '@/utils/utc-day';

export const CHAT_DAILY_TURN_LIMIT_MESSAGE = '今日对话次数已用完，请明天再试';

/** 消耗一次 UTC 日对话配额（单聊 / 群聊共用）；超限抛 429。 */
export async function assertChatDailyTurnQuota(userId: string, now = new Date()): Promise<void> {
  await assertRateLimits([
    {
      key: `ratelimit:chat:daily:${userId}:${formatUtcDate(now)}`,
      limit: env.CHAT_DAILY_TURN_LIMIT,
      windowSeconds: secondsUntilNextUtcMidnight(now),
      message: CHAT_DAILY_TURN_LIMIT_MESSAGE,
      code: API_ERROR_CODE.CHAT_DAILY_TURN_LIMIT,
    },
  ]);
}
