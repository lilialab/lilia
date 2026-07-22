import { withApiHandler } from '@/lib/server/api-handler';
import { parseJsonBody } from '@/lib/server/parse-schema';
import { createAuthSession, setSessionCookie } from '@/lib/server/session';
import { registerBodySchema } from '@/schemas/api/auth/register';
import { registerUser } from '@/services/user/users.service';
import { type NextRequest, NextResponse } from 'next/server';

export const POST = withApiHandler(async (req: NextRequest) => {
  const { username, displayName, password, timeZone } = await parseJsonBody(
    registerBodySchema,
    req,
  );
  const user = await registerUser({ username, displayName, password, timeZone });

  const token = await createAuthSession(user.id);
  const response = NextResponse.json({
    success: true,
    data: { user },
  });
  setSessionCookie(response, token);
  return response;
});
