import { createHmac, randomBytes } from 'node:crypto';
import { type NextResponse } from 'next/server';
import { env } from '@/lib/server/env';
import { prisma } from '@/lib/server/prisma';

function hashSessionToken(token: string): string {
  return createHmac('sha256', env.AUTH_SESSION_SECRET).update(token).digest('hex');
}

function getSessionExpiresAt(): Date {
  const ms = env.AUTH_SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;
  return new Date(Date.now() + ms);
}

/** 创建登录会话并返回明文 token（仅用于写入 Cookie）。 */
export async function createAuthSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString('hex');
  const tokenHash = hashSessionToken(token);

  await prisma.authSession.create({
    data: {
      userId,
      tokenHash,
      expiresAt: getSessionExpiresAt(),
    },
  });

  return token;
}

/** 根据 session token 解析用户 ID；无效或过期返回 null。 */
export async function resolveSessionUserId(token: string): Promise<string | null> {
  const tokenHash = hashSessionToken(token);
  const session = await prisma.authSession.findUnique({
    where: { tokenHash },
    select: { userId: true, expiresAt: true },
  });

  if (!session || session.expiresAt.getTime() <= Date.now()) {
    return null;
  }

  return session.userId;
}

/** 吊销单个 session。 */
export async function revokeAuthSession(token: string): Promise<void> {
  const tokenHash = hashSessionToken(token);
  await prisma.authSession.deleteMany({ where: { tokenHash } });
}

/** 将 session token 写入 httpOnly Cookie。 */
export function setSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set(env.AUTH_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: env.AUTH_SESSION_TTL_DAYS * 24 * 60 * 60,
  });
}

/** 清除 session Cookie。 */
export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(env.AUTH_SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,
  });
}
