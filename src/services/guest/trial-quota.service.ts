import { env } from '@/lib/server/env';
import { assertRateLimits } from '@/lib/server/rate-limit';
import { getRedisConnection } from '@/lib/server/redis';
import { API_ERROR_CODE } from '@/types/api-error';
import { formatUtcDate, secondsUntilNextUtcMidnight } from '@/utils/utc-day';

export const GUEST_TRIAL_DAILY_TURN_LIMIT_MESSAGE =
  '今日试聊次数已用完。注册即可畅聊、创建角色，解锁完整功能';

function guestTrialDailyTurnKey(guestId: string, now: Date): string {
  return `ratelimit:guest-trial:daily:${guestId}:${formatUtcDate(now)}`;
}

/** 消耗一次访客试聊 UTC 日配额；超限抛 429。不调度记忆。 */
export async function assertGuestTrialDailyTurnQuota(
  guestId: string,
  now = new Date(),
): Promise<void> {
  await assertRateLimits([
    {
      key: guestTrialDailyTurnKey(guestId, now),
      limit: env.GUEST_TRIAL_DAILY_TURN_LIMIT,
      windowSeconds: secondsUntilNextUtcMidnight(now),
      message: GUEST_TRIAL_DAILY_TURN_LIMIT_MESSAGE,
      code: API_ERROR_CODE.GUEST_TRIAL_DAILY_TURN_LIMIT,
    },
  ]);
}

/** 读取当日已用次数（未用过则为 0）。 */
export async function getGuestTrialDailyTurnUsage(
  guestId: string,
  now = new Date(),
): Promise<{ used: number; limit: number; remaining: number }> {
  const redis = getRedisConnection();
  const raw = await redis.get(guestTrialDailyTurnKey(guestId, now));
  const used = raw ? Number(raw) : 0;
  const safeUsed = Number.isFinite(used) && used > 0 ? Math.floor(used) : 0;
  const limit = env.GUEST_TRIAL_DAILY_TURN_LIMIT;
  return {
    used: safeUsed,
    limit,
    remaining: Math.max(0, limit - safeUsed),
  };
}
