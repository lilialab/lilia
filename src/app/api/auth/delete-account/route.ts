import { withApiHandler } from '@/lib/server/api-handler';
import { AppError } from '@/lib/server/app-error';
import { parseJsonBody } from '@/lib/server/parse-schema';
import { getSessionTokenFromRequest, resolveRequestUserId } from '@/lib/server/request-user';
import { clearSessionCookie } from '@/lib/server/session';
import { deleteAccountBodySchema } from '@/schemas/api/auth/delete-account';
import { deleteUserAccount } from '@/services/user/users.service';
import { type NextRequest, NextResponse } from 'next/server';

export const POST = withApiHandler(async (req: NextRequest) => {
  const token = getSessionTokenFromRequest(req);
  if (!token) {
    throw AppError.unauthorized('未登录');
  }

  const userId = await resolveRequestUserId(req);
  const { currentPassword } = await parseJsonBody(deleteAccountBodySchema, req);
  await deleteUserAccount(userId, currentPassword);

  const response = NextResponse.json({ success: true, data: {} });
  clearSessionCookie(response);
  return response;
});
