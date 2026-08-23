import { withApiHandler } from '@/lib/server/api-handler';
import { AppError } from '@/lib/server/app-error';
import { parseJsonBody } from '@/lib/server/parse-schema';
import { getSessionTokenFromRequest, resolveRequestUserId } from '@/lib/server/request-user';
import { clearSessionCookie } from '@/lib/server/session';
import { changePasswordBodySchema } from '@/schemas/api/auth/change-password';
import { changeUserPassword } from '@/services/user/users.service';
import { type NextRequest, NextResponse } from 'next/server';

export const POST = withApiHandler(async (req: NextRequest) => {
  const token = getSessionTokenFromRequest(req);
  if (!token) {
    throw AppError.unauthorized('未登录');
  }

  const userId = await resolveRequestUserId(req);
  const { currentPassword, newPassword } = await parseJsonBody(changePasswordBodySchema, req);
  await changeUserPassword(userId, { currentPassword, newPassword });

  const response = NextResponse.json({ success: true, data: {} });
  clearSessionCookie(response);
  return response;
});
