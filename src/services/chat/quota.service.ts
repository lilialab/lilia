import { env } from '@/lib/server/env';
import { assertRateLimits } from '@/lib/server/rate-limit';
import { getRedisConnection } from '@/lib/server/redis';
import { API_ERROR_CODE } from '@/types/api-error';
import { formatUtcDate, secondsUntilNextUtcMidnight } from '@/utils/utc-day';

export const CHAT_DAILY_TURN_LIMIT_MESSAGE = '今天体力用光了，明天再来吧';

function chatDailyTurnKey(userId: string, now: Date): string {
  return `ratelimit:chat:daily:${userId}:${formatUtcDate(now)}`;
}

/** 消耗一次 UTC 日对话配额（单聊 / 群聊共用）；超限抛 429。 */
export async function assertChatDailyTurnQuota(userId: string, now = new Date()): Promise<void> {
  await assertRateLimits([
    {
      key: chatDailyTurnKey(userId, now),
      limit: env.CHAT_DAILY_TURN_LIMIT,
      windowSeconds: secondsUntilNextUtcMidnight(now),
      message: CHAT_DAILY_TURN_LIMIT_MESSAGE,
      code: API_ERROR_CODE.CHAT_DAILY_TURN_LIMIT,
    },
  ]);
}

/** 读取当日已用对话次数与剩余额度（未用过则为 0）。 */
export async function getChatDailyTurnUsage(
  userId: string,
  now = new Date(),
): Promise<{ used: number; limit: number; remaining: number }> {
  const redis = getRedisConnection();
  const raw = await redis.get(chatDailyTurnKey(userId, now));
  const used = raw ? Number(raw) : 0;
  const safeUsed = Number.isFinite(used) && used > 0 ? Math.floor(used) : 0;
  const limit = env.CHAT_DAILY_TURN_LIMIT;
  return {
    used: safeUsed,
    limit,
    remaining: Math.max(0, limit - safeUsed),
  };
}
