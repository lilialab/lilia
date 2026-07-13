import { type NextRequest } from 'next/server';
import { getOrCreateDefaultSession } from '@/services/session/sessions.service';
import { withApiHandler, successResponse } from '@/lib/server/api-handler';
import { resolveRequestUserId } from '@/lib/server/request-user';

export const GET = withApiHandler(async (req: NextRequest) => {
  const userId = await resolveRequestUserId(req);
  const session = await getOrCreateDefaultSession(userId);
  return successResponse(session);
});
