import { getOrCreateDefaultSession } from '@/services/session/sessions.service';
import { withApiHandler, successResponse } from '@/lib/server/api-handler';

export const GET = withApiHandler(async () => {
  const session = await getOrCreateDefaultSession();
  return successResponse(session);
});
