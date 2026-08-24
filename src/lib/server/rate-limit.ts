import { AppError } from '@/lib/server/app-error';
import { getRedisConnection } from '@/lib/server/redis';
import { API_ERROR_CODE, type ApiErrorCode } from '@/types/api-error';

export type RateLimitWindow = {
  key: string;
  limit: number;
  windowSeconds: number;
  message?: string;
  code?: ApiErrorCode;
};

const RATE_LIMIT_LUA = `
local current = redis.call('INCR', KEYS[1])
if current == 1 then
  redis.call('EXPIRE', KEYS[1], ARGV[1])
end
if current > tonumber(ARGV[2]) then
  return 0
end
return 1
`;

/** 固定窗口计数；任一窗口超限则抛 429。 */
export async function assertRateLimits(windows: RateLimitWindow[]): Promise<void> {
  const redis = getRedisConnection();

  for (const window of windows) {
    const allowed = await redis.eval(
      RATE_LIMIT_LUA,
      1,
      window.key,
      window.windowSeconds,
      window.limit,
    );

    if (allowed !== 1) {
      throw AppError.tooManyRequests(
        window.message ?? '操作太频繁，请稍后再试',
        window.code ?? API_ERROR_CODE.RATE_LIMITED,
      );
    }
  }
}
