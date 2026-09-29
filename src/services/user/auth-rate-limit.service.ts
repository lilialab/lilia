import { getRequestClientIp } from '@/lib/server/client-ip';
import { env } from '@/lib/server/env';
import { assertRateLimits, type RateLimitWindow } from '@/lib/server/rate-limit';
import { type NextRequest } from 'next/server';

const MINUTE_SECONDS = 60;
const HOUR_SECONDS = 60 * MINUTE_SECONDS;
const DAY_SECONDS = 24 * HOUR_SECONDS;

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function registerRateLimitWindows(clientIp: string): RateLimitWindow[] {
  return [
    {
      key: `ratelimit:auth:register:ip:${clientIp}:1h`,
      limit: env.AUTH_RATE_LIMIT_REGISTER_PER_IP_HOUR,
      windowSeconds: HOUR_SECONDS,
    },
    {
      key: `ratelimit:auth:register:ip:${clientIp}:1d`,
      limit: env.AUTH_RATE_LIMIT_REGISTER_PER_IP_DAY,
      windowSeconds: DAY_SECONDS,
    },
  ];
}

function loginRateLimitWindows(clientIp: string, account: string): RateLimitWindow[] {
  const normalizedAccount = account.trim().toLowerCase();

  return [
    {
      key: `ratelimit:auth:login:ip:${clientIp}:1m`,
      limit: env.AUTH_RATE_LIMIT_LOGIN_PER_IP_MINUTE,
      windowSeconds: MINUTE_SECONDS,
    },
    {
      key: `ratelimit:auth:login:account:${normalizedAccount}:15m`,
      limit: env.AUTH_RATE_LIMIT_LOGIN_PER_ACCOUNT_15MIN,
      windowSeconds: 15 * MINUTE_SECONDS,
    },
  ];
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                 */
/* -------------------------------------------------------------------------- */

/** 注册接口限流（按 IP）。 */
export async function assertRegisterRateLimit(req: NextRequest): Promise<void> {
  const clientIp = getRequestClientIp(req);
  await assertRateLimits(registerRateLimitWindows(clientIp));
}

/** 匿名建号限流：与注册同 key 同额度，共用一份配额。 */
export async function assertAnonymousRateLimit(req: NextRequest): Promise<void> {
  const clientIp = getRequestClientIp(req);
  await assertRateLimits(registerRateLimitWindows(clientIp));
}

/** 登录接口限流（按 IP 与账号）。 */
export async function assertLoginRateLimit(req: NextRequest, account: string): Promise<void> {
  const clientIp = getRequestClientIp(req);
  await assertRateLimits(loginRateLimitWindows(clientIp, account));
}
