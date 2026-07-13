import { type NextRequest } from 'next/server';
import { withApiHandler, successResponse } from '@/lib/server/api-handler';
import { resolveRequestUserId } from '@/lib/server/request-user';
import { getUserById } from '@/services/user/users.service';
import { AppError } from '@/lib/server/app-error';

export const GET = withApiHandler(async (req: NextRequest) => {
  const userId = await resolveRequestUserId(req);
  const user = await getUserById(userId);

  if (!user) {
    throw AppError.unauthorized('用户不存在');
  }

  return successResponse({ user });
});
