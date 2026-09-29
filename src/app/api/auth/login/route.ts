import { withApiHandler } from '@/lib/server/api-handler';
import { parseJsonBody } from '@/lib/server/parse-schema';
import { createAuthSession, setSessionCookie } from '@/lib/server/session';
import { verifyTurnstileToken } from '@/lib/server/turnstile';
import { TURNSTILE_ACTION } from '@/lib/turnstile';
import { loginBodySchema } from '@/schemas/api/auth/login';
import { assertLoginRateLimit } from '@/services/user/auth-rate-limit.service';
import { authenticateUser } from '@/services/user/users.service';
import { type NextRequest, NextResponse } from 'next/server';

export const POST = withApiHandler(async (req: NextRequest) => {
  const { account, password, turnstileToken } = await parseJsonBody(loginBodySchema, req);
  await verifyTurnstileToken(turnstileToken, {
    expectedAction: TURNSTILE_ACTION.LOGIN,
  });
  await assertLoginRateLimit(req, account);
  const { id } = await authenticateUser(account, password);

  const token = await createAuthSession(id);
  const response = NextResponse.json({ success: true, data: {} });
  setSessionCookie(response, token);
  return response;
});
