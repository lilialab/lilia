import { type NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/server/env';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(env.AUTH_SESSION_COOKIE_NAME)?.value);

  if (pathname.startsWith('/chat') && !hasSession) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (pathname === '/login' && hasSession) {
    return NextResponse.redirect(new URL('/chat', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/chat/:path*', '/login'],
};
