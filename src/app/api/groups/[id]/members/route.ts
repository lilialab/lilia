import { successResponse, withApiHandler } from '@/lib/server/api-handler';
import { parseJsonBody, parseRouteParams } from '@/lib/server/parse-schema';
import { resolveRequestUserId } from '@/lib/server/request-user';
import { replaceGroupMembersBodySchema } from '@/schemas/api/groups/members-put';
import { groupParamsSchema } from '@/schemas/api/groups/params';
import { replaceGroupMembers } from '@/services/group/groups.service';
import { type NextRequest } from 'next/server';

export const PUT = withApiHandler(
  async (req: NextRequest, context: RouteContext<'/api/groups/[id]/members'>) => {
    const userId = await resolveRequestUserId(req);
    const { id: groupSessionId } = await parseRouteParams(groupParamsSchema, context.params);
    const body = await parseJsonBody(replaceGroupMembersBodySchema, req);
    const group = await replaceGroupMembers(groupSessionId, userId, body.characterIds);
    return successResponse({ group });
  },
);
