import { withApiHandler } from '@/lib/server/api-handler';
import { parseJsonBody } from '@/lib/server/parse-schema';
import { createAuthSession, setSessionCookie } from '@/lib/server/session';
import { loginBodySchema } from '@/schemas/api/auth/login';
import { authenticateUser } from '@/services/user/users.service';
import { type NextRequest, NextResponse } from 'next/server';

export const POST = withApiHandler(async (req: NextRequest) => {
  const { username, password } = await parseJsonBody(loginBodySchema, req);
  const { id } = await authenticateUser(username, password);

  const token = await createAuthSession(id);
  const response = NextResponse.json({ success: true, data: {} });
  setSessionCookie(response, token);
  return response;
});
