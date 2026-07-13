import { type NextRequest } from 'next/server';
import { completeDefaultSession } from '@/services/session/sessions.service';
import { withApiHandler, successResponse } from '@/lib/server/api-handler';
import { parseSearchParams } from '@/lib/server/parse-schema';
import { memoryUsernameQuerySchema } from '@/schemas/api/memory/username';
import { resolveUserIdByUsername } from '@/services/user/users.service';

export const POST = withApiHandler(async (req: NextRequest) => {
  const { username } = parseSearchParams(memoryUsernameQuerySchema, req.nextUrl.searchParams);
  const userId = await resolveUserIdByUsername(username);
  const { session, alreadyCompleted } = await completeDefaultSession(userId);

  return successResponse({
    sessionId: session.id,
    status: session.status,
    alreadyCompleted,
  });
});
