import { successResponse, withApiHandler } from '@/lib/server/api-handler';
import { resolveRequestUserId } from '@/lib/server/request-user';
import { requireUserById } from '@/services/user/users.service';
import { type NextRequest } from 'next/server';

export const GET = withApiHandler(async (req: NextRequest) => {
  const userId = await resolveRequestUserId(req);
  const user = await requireUserById(userId);
  return successResponse({ user });
});
