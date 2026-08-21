import { withApiHandler } from '@/lib/server/api-handler';
import { parseJsonBody } from '@/lib/server/parse-schema';
import { createAuthSession, setSessionCookie } from '@/lib/server/session';
import { registerBodySchema } from '@/schemas/api/auth/register';
import { registerUser } from '@/services/user/users.service';
import { type NextRequest, NextResponse } from 'next/server';

export const POST = withApiHandler(async (req: NextRequest) => {
  const { username, displayName, password, locale } = await parseJsonBody(registerBodySchema, req);
  const { id } = await registerUser({ username, displayName, password, locale });

  const token = await createAuthSession(id);
  const response = NextResponse.json({ success: true, data: {} });
  setSessionCookie(response, token);
  return response;
});
