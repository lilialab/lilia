import { withApiHandler } from '@/lib/server/api-handler';
import { parseJsonBody } from '@/lib/server/parse-schema';
import { createAuthSession, setSessionCookie } from '@/lib/server/session';
import { verifyTurnstileToken } from '@/lib/server/turnstile';
import { TURNSTILE_ACTION } from '@/lib/turnstile';
import { anonymousBodySchema } from '@/schemas/api/auth/anonymous';
import {
  generateAnonymousAccount,
  generateAnonymousNickname,
} from '@/services/user/anonymous-account';
import { assertAnonymousRateLimit } from '@/services/user/auth-rate-limit.service';
import { createAnonymousUser } from '@/services/user/users.service';
import { type NextRequest, NextResponse } from 'next/server';

/** 一键创建匿名账号并直接登录（无密码，后续可「保存账号」补上）。 */
export const POST = withApiHandler(async (req: NextRequest) => {
  const { locale, timeZone, turnstileToken } = await parseJsonBody(anonymousBodySchema, req);
  await verifyTurnstileToken(turnstileToken, {
    expectedAction: TURNSTILE_ACTION.ANONYMOUS,
  });
  await assertAnonymousRateLimit(req);

  const { id } = await createAnonymousUser({
    account: generateAnonymousAccount(),
    nickname: generateAnonymousNickname(),
    locale,
    timeZone,
  });

  const token = await createAuthSession(id);
  const response = NextResponse.json({ success: true, data: {} });
  setSessionCookie(response, token);
  return response;
});
