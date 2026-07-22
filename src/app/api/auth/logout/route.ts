import { withApiHandler } from '@/lib/server/api-handler';
import { getSessionTokenFromRequest } from '@/lib/server/request-user';
import { clearSessionCookie, revokeAuthSession } from '@/lib/server/session';
import { type NextRequest, NextResponse } from 'next/server';

export const POST = withApiHandler(async (req: NextRequest) => {
  const token = getSessionTokenFromRequest(req);
  if (token) {
    await revokeAuthSession(token);
  }

  const response = NextResponse.json({ success: true, data: {} });
  clearSessionCookie(response);
  return response;
});
