import { type NextRequest, NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/server/api-handler';
import { parseJsonBody } from '@/lib/server/parse-schema';
import { registerBodySchema } from '@/schemas/api/auth/register';
import { registerUser } from '@/services/user/users.service';
import { createAuthSession, setSessionCookie } from '@/lib/server/session';

export const POST = withApiHandler(async (req: NextRequest) => {
  const { username, displayName, password } = await parseJsonBody(registerBodySchema, req);
  const user = await registerUser({ username, displayName, password });

  const token = await createAuthSession(user.id);
  const response = NextResponse.json({
    success: true,
    data: { user },
  });
  setSessionCookie(response, token);
  return response;
});
