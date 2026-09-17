import { successResponse, withApiHandler } from '@/lib/server/api-handler';
import { parseJsonBody } from '@/lib/server/parse-schema';
import { issueGuestTrialCredentialBodySchema } from '@/schemas/api/guest/trial-credential-post';
import { getGuestTrialTokenFromRequest, setGuestTrialCookie } from '@/services/guest/trial-cookie';
import {
  issueGuestTrialCredential,
  resolveGuestTrialCredential,
} from '@/services/guest/trial-credential.service';
import { type NextRequest, NextResponse } from 'next/server';

/** 查询当日访客试聊凭证是否有效。 */
export const GET = withApiHandler(async (req: NextRequest) => {
  const token = getGuestTrialTokenFromRequest(req);
  const credential = resolveGuestTrialCredential(token);
  return successResponse({
    guestId: credential.guestId,
    utcDay: credential.utcDay,
  });
});

/**
 * 签发或复用当日访客试聊凭证。
 * 已有今日 cookie 时可不传 turnstileToken；否则必须先过人机验证。
 */
export const POST = withApiHandler(async (req: NextRequest) => {
  const body = await parseJsonBody(issueGuestTrialCredentialBodySchema, req);
  const existingToken = getGuestTrialTokenFromRequest(req);
  const issued = await issueGuestTrialCredential({
    existingToken,
    turnstileToken: body.turnstileToken,
  });

  const response = NextResponse.json({
    success: true,
    data: {
      guestId: issued.credential.guestId,
      utcDay: issued.credential.utcDay,
      turnstileUsed: issued.turnstileUsed,
    },
  });
  setGuestTrialCookie(response, issued.token);
  return response;
});
