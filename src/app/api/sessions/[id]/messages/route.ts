import { successResponse, withApiHandler } from '@/lib/server/api-handler';
import { parseRouteParams } from '@/lib/server/parse-schema';
import { resolveRequestUserId } from '@/lib/server/request-user';
import { sessionParamsSchema } from '@/schemas/api/sessions/params';
import { softDeleteSessionMessages } from '@/services/chat/message.service';
import { assertSessionOwnedByUser } from '@/services/session/sessions.service';
import { type NextRequest } from 'next/server';

export const DELETE = withApiHandler(
  async (req: NextRequest, context: RouteContext<'/api/sessions/[id]/messages'>) => {
    const userId = await resolveRequestUserId(req);
    const { id: sessionId } = await parseRouteParams(sessionParamsSchema, context.params);
    await assertSessionOwnedByUser(sessionId, userId);

    const result = await softDeleteSessionMessages(sessionId);

    return successResponse({ count: result.count });
  },
);
