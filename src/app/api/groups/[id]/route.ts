import { successResponse, withApiHandler } from '@/lib/server/api-handler';
import { parseRouteParams } from '@/lib/server/parse-schema';
import { resolveRequestUserId } from '@/lib/server/request-user';
import { groupParamsSchema } from '@/schemas/api/groups/params';
import { getGroupOrThrow } from '@/services/group/groups.service';
import { type NextRequest } from 'next/server';

export const GET = withApiHandler(
  async (req: NextRequest, context: RouteContext<'/api/groups/[id]'>) => {
    const userId = await resolveRequestUserId(req);
    const { id: groupSessionId } = await parseRouteParams(groupParamsSchema, context.params);
    const group = await getGroupOrThrow(groupSessionId, userId);
    return successResponse({ group });
  },
);
