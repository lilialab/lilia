import { type NextRequest } from 'next/server';
import { withApiHandler, successResponse } from '@/lib/server/api-handler';
import { resolveRequestUserId } from '@/lib/server/request-user';
import { requireUserById } from '@/services/user/users.service';

export const GET = withApiHandler(async (req: NextRequest) => {
  const userId = await resolveRequestUserId(req);
  const user = await requireUserById(userId);
  return successResponse({ user });
});
