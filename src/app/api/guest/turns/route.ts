import { successResponse, withApiHandler } from '@/lib/server/api-handler';
import { getGuestTrialTokenFromRequest } from '@/services/guest/trial-cookie';
import { resolveGuestTrialCredential } from '@/services/guest/trial-credential.service';
import {
  assertGuestTrialDailyTurnQuota,
  getGuestTrialDailyTurnUsage,
} from '@/services/guest/trial-quota.service';
import { type NextRequest } from 'next/server';

/** 查询当日试聊配额用量（需有效凭证）。 */
export const GET = withApiHandler(async (req: NextRequest) => {
  const credential = resolveGuestTrialCredential(getGuestTrialTokenFromRequest(req));
  const usage = await getGuestTrialDailyTurnUsage(credential.guestId);
  return successResponse(usage);
});

/**
 * 消耗一次试聊回合配额（口径同正式聊天日限额）。
 * 仅扣次，不落消息、不调度记忆；S4 正式流式开聊将直接调 assertGuestTrialDailyTurnQuota。
 */
export const POST = withApiHandler(async (req: NextRequest) => {
  const credential = resolveGuestTrialCredential(getGuestTrialTokenFromRequest(req));
  await assertGuestTrialDailyTurnQuota(credential.guestId);
  const usage = await getGuestTrialDailyTurnUsage(credential.guestId);
  return successResponse(usage);
});
