import { type NextRequest } from 'next/server';
import { AppError } from '@/lib/server/app-error';
import { env } from '@/lib/server/env';
import { resolveSessionUserId } from '@/lib/server/session';

/** 从请求 Cookie 读取 session token。 */
export function getSessionTokenFromRequest(req: NextRequest): string | null {
  const token = req.cookies.get(env.AUTH_SESSION_COOKIE_NAME)?.value?.trim();
  return token || null;
}

/** 从 Cookie 会话解析当前用户 ID。 */
export async function resolveRequestUserId(req: NextRequest): Promise<string> {
  const token = getSessionTokenFromRequest(req);
  if (!token) {
    throw AppError.unauthorized('未登录');
  }

  const userId = await resolveSessionUserId(token);
  if (!userId) {
    throw AppError.unauthorized('登录已过期，请重新登录');
  }

  return userId;
}
