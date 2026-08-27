import { successResponse, withApiHandler } from '@/lib/server/api-handler';
import { parseRouteParams, parseSearchParams } from '@/lib/server/parse-schema';
import { resolveRequestUserId } from '@/lib/server/request-user';
import { groupHistoryQuerySchema } from '@/schemas/api/groups/history-query';
import { groupParamsSchema } from '@/schemas/api/groups/params';
import { assertGroupOwnedByUser } from '@/services/group/groups.service';
import { getGroupHistoryPage } from '@/services/group/message.service';
import { type NextRequest } from 'next/server';

export const GET = withApiHandler(
  async (req: NextRequest, context: RouteContext<'/api/groups/[id]/messages'>) => {
    const userId = await resolveRequestUserId(req);
    const { id: groupSessionId } = await parseRouteParams(groupParamsSchema, context.params);
    await assertGroupOwnedByUser(groupSessionId, userId);

    const query = parseSearchParams(groupHistoryQuerySchema, req.nextUrl.searchParams);
    const page = await getGroupHistoryPage(groupSessionId, {
      limit: query.limit,
      before: query.before,
    });

    return successResponse(page);
  },
);
