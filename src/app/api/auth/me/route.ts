import { successResponse, withApiHandler } from '@/lib/server/api-handler';
import { parseJsonBody } from '@/lib/server/parse-schema';
import { resolveRequestUserId } from '@/lib/server/request-user';
import { patchMeBodySchema } from '@/schemas/api/auth/patch-me';
import {
  requireUserById,
  updateUserDisplayName,
  updateUserLocale,
} from '@/services/user/users.service';
import { type NextRequest } from 'next/server';

export const GET = withApiHandler(async (req: NextRequest) => {
  const userId = await resolveRequestUserId(req);
  const user = await requireUserById(userId);
  return successResponse({ user });
});

export const PATCH = withApiHandler(async (req: NextRequest) => {
  const userId = await resolveRequestUserId(req);
  const body = await parseJsonBody(patchMeBodySchema, req);

  if ('displayName' in body) {
    const user = await updateUserDisplayName(userId, body.displayName);
    return successResponse({ user });
  }

  const user = await updateUserLocale(userId, body.locale);
  return successResponse({ user });
});
