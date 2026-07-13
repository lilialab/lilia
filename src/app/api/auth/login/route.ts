import { type NextRequest, NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/server/api-handler';
import { parseJsonBody } from '@/lib/server/parse-schema';
import { loginBodySchema } from '@/schemas/api/auth/login';
import { findUserByUsername } from '@/services/user/users.service';
import { verifyPassword } from '@/lib/server/password';
import { AppError } from '@/lib/server/app-error';
import { createAuthSession, setSessionCookie } from '@/lib/server/session';

export const POST = withApiHandler(async (req: NextRequest) => {
  const { username, password } = await parseJsonBody(loginBodySchema, req);
  const user = await findUserByUsername(username);

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw AppError.unauthorized('账号或密码错误');
  }

  const token = await createAuthSession(user.id);
  const response = NextResponse.json({
    success: true,
    data: {
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
      },
    },
  });
  setSessionCookie(response, token);
  return response;
});
