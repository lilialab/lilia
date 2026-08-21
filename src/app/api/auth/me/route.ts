import { successResponse, withApiHandler } from '@/lib/server/api-handler';
import { parseJsonBody } from '@/lib/server/parse-schema';
import { resolveRequestUserId } from '@/lib/server/request-user';
import { patchMeBodySchema } from '@/schemas/api/auth/patch-me';
import { requireUserById, updateUserLocale } from '@/services/user/users.service';
import { type NextRequest } from 'next/server';

export const GET = withApiHandler(async (req: NextRequest) => {
  const userId = await resolveRequestUserId(req);
  const user = await requireUserById(userId);
  return successResponse({ user });
});

export const PATCH = withApiHandler(async (req: NextRequest) => {
  const userId = await resolveRequestUserId(req);
  const { locale } = await parseJsonBody(patchMeBodySchema, req);
  const user = await updateUserLocale(userId, locale);
  return successResponse({ user });
});
