import { successResponse, withApiHandler } from '@/lib/server/api-handler';
import { getGuestTrialTokenFromRequest } from '@/services/guest/trial-cookie';
import { resolveGuestTrialCredential } from '@/services/guest/trial-credential.service';
import { type NextRequest } from 'next/server';

/**
 * 受保护试聊探针：无有效当日凭证则 401。
 * S1 验收用；后续试聊 API 复用同一 resolve。
 */
export const GET = withApiHandler(async (req: NextRequest) => {
  const token = getGuestTrialTokenFromRequest(req);
  const credential = resolveGuestTrialCredential(token);
  return successResponse({
    ok: true,
    guestId: credential.guestId,
    utcDay: credential.utcDay,
  });
});
