import { type NextRequest } from 'next/server';
import { withApiHandler, successResponse } from '@/lib/server/api-handler';
import { parseRouteParams } from '@/lib/server/parse-schema';
import { sessionParamsSchema } from '@/schemas/api/sessions/params';
import { softDeleteSessionMessages } from '@/services/chat/message.service';

export const DELETE = withApiHandler(
  async (_req: NextRequest, context: { params: Promise<unknown> }) => {
    const { id: sessionId } = await parseRouteParams(sessionParamsSchema, context.params);

    const result = await softDeleteSessionMessages(sessionId);

    return successResponse({ count: result.count });
  },
);
