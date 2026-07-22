import { type NextRequest } from 'next/server';
import { withApiHandler, successResponse } from '@/lib/server/api-handler';
import { parseRouteParams, parseSearchParams } from '@/lib/server/parse-schema';
import { sessionHistoryQuerySchema } from '@/schemas/api/sessions/history-query';
import { sessionParamsSchema } from '@/schemas/api/sessions/params';
import { getHistoryPage } from '@/services/chat/message.service';
import { resolveRequestUserId } from '@/lib/server/request-user';
import { assertSessionOwnedByUser } from '@/services/session/sessions.service';

// 获取指定会话的历史消息列表
export const GET = withApiHandler(
  async (req: NextRequest, context: RouteContext<'/api/sessions/[id]'>) => {
    const userId = await resolveRequestUserId(req);
    const { id: sessionId } = await parseRouteParams(sessionParamsSchema, context.params);
    await assertSessionOwnedByUser(sessionId, userId);

    const query = parseSearchParams(sessionHistoryQuerySchema, req.nextUrl.searchParams);

    const page = await getHistoryPage(sessionId, {
      limit: query.limit,
      before: query.before,
    });

    return successResponse(page);
  },
);
