import { successResponse, withApiHandler } from '@/lib/server/api-handler';
import { resolveRequestUserId } from '@/lib/server/request-user';
import { getChatDailyTurnUsage } from '@/services/chat/quota.service';
import { type NextRequest } from 'next/server';

/** 查询当日对话配额用量（单聊 / 群聊共用）。 */
export const GET = withApiHandler(async (req: NextRequest) => {
  const userId = await resolveRequestUserId(req);
  const usage = await getChatDailyTurnUsage(userId);
  return successResponse(usage);
});
