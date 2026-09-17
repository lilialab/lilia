import { AppError } from '@/lib/server/app-error';
import { env } from '@/lib/server/env';
import { API_ERROR_CODE } from '@/types/api-error';
import { formatUtcDate, secondsUntilNextUtcMidnight } from '@/utils/utc-day';
import { type NextRequest, type NextResponse } from 'next/server';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export type GuestTrialCredential = {
  guestId: string;
  utcDay: string;
};

function signGuestTrialPayload(guestId: string, utcDay: string): string {
  return createHmac('sha256', env.AUTH_SESSION_SECRET)
    .update(`${guestId}.${utcDay}`)
    .digest('hex');
}

function safeEqualHex(a: string, b: string): boolean {
  const left = Buffer.from(a, 'utf8');
  const right = Buffer.from(b, 'utf8');
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}

/** 签发访客试聊 cookie 明文 token（guestId.utcDay.sig）。 */
export function createGuestTrialToken(guestId: string, utcDay: string): string {
  const sig = signGuestTrialPayload(guestId, utcDay);
  return `${guestId}.${utcDay}.${sig}`;
}

/** 解析并校验签名；格式或签名错误返回 null（不校验是否仍为「今日」）。 */
export function parseGuestTrialToken(token: string): GuestTrialCredential | null {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }
  const [guestId, utcDay, sig] = parts;
  if (!guestId || !utcDay || !sig) {
    return null;
  }
  if (!/^[0-9a-f]{32}$/.test(guestId)) {
    return null;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(utcDay)) {
    return null;
  }
  const expected = signGuestTrialPayload(guestId, utcDay);
  if (!safeEqualHex(sig, expected)) {
    return null;
  }
  return { guestId, utcDay };
}

/** 生成新的访客 ID。 */
export function newGuestTrialId(): string {
  return randomBytes(16).toString('hex');
}

/** 从请求 Cookie 读取访客试聊 token。 */
export function getGuestTrialTokenFromRequest(req: NextRequest): string | null {
  const token = req.cookies.get(env.GUEST_TRIAL_COOKIE_NAME)?.value?.trim();
  return token || null;
}

/** 写入访客试聊 Cookie，有效期到下一个 UTC 午夜。 */
export function setGuestTrialCookie(
  response: NextResponse,
  token: string,
  now = new Date(),
): void {
  response.cookies.set(env.GUEST_TRIAL_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: secondsUntilNextUtcMidnight(now),
  });
}

/** 清除访客试聊 Cookie。 */
export function clearGuestTrialCookie(response: NextResponse): void {
  response.cookies.set(env.GUEST_TRIAL_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,
  });
}

/**
 * 解析 token 且须为今日 UTC 凭证；否则抛 GUEST_TRIAL_REQUIRED。
 */
export function assertGuestTrialCredential(
  token: string | null | undefined,
  now = new Date(),
): GuestTrialCredential {
  if (!token) {
    throw AppError.forbidden('需要先完成试聊验证', API_ERROR_CODE.GUEST_TRIAL_REQUIRED);
  }
  const parsed = parseGuestTrialToken(token);
  if (!parsed || parsed.utcDay !== formatUtcDate(now)) {
    throw AppError.forbidden('试聊凭证无效或已过期', API_ERROR_CODE.GUEST_TRIAL_REQUIRED);
  }
  return parsed;
}
