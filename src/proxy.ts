import { type NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/server/env';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(env.AUTH_SESSION_COOKIE_NAME)?.value);

  // 旧通讯录入口 /chat → /contacts
  if (pathname === '/chat') {
    return NextResponse.redirect(new URL('/contacts', request.url));
  }

  const needsAuth =
    pathname.startsWith('/chat/') ||
    pathname.startsWith('/contacts') ||
    pathname.startsWith('/groups') ||
    pathname === '/me' ||
    pathname.startsWith('/me/');

  if (needsAuth && !hasSession) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (pathname === '/login' && hasSession) {
    return NextResponse.redirect(new URL('/contacts', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/chat',
    '/chat/:path*',
    '/contacts',
    '/contacts/:path*',
    '/groups',
    '/groups/:path*',
    '/me',
    '/me/:path*',
    '/login',
  ],
};
