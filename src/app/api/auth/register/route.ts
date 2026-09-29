import { withApiHandler } from '@/lib/server/api-handler';
import { parseJsonBody } from '@/lib/server/parse-schema';
import { createAuthSession, setSessionCookie } from '@/lib/server/session';
import { verifyTurnstileToken } from '@/lib/server/turnstile';
import { TURNSTILE_ACTION } from '@/lib/turnstile';
import { registerBodySchema } from '@/schemas/api/auth/register';
import { assertRegisterRateLimit } from '@/services/user/auth-rate-limit.service';
import { registerUser } from '@/services/user/users.service';
import { type NextRequest, NextResponse } from 'next/server';

export const POST = withApiHandler(async (req: NextRequest) => {
  await assertRegisterRateLimit(req);
  const { account, nickname, password, locale, timeZone, turnstileToken } = await parseJsonBody(
    registerBodySchema,
    req,
  );
  await verifyTurnstileToken(turnstileToken, {
    expectedAction: TURNSTILE_ACTION.REGISTER,
  });
  const { id } = await registerUser({ account, nickname, password, locale, timeZone });

  const token = await createAuthSession(id);
  const response = NextResponse.json({ success: true, data: {} });
  setSessionCookie(response, token);
  return response;
});
