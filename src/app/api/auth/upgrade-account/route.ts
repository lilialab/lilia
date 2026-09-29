import { successResponse, withApiHandler } from '@/lib/server/api-handler';
import { parseJsonBody } from '@/lib/server/parse-schema';
import { resolveRequestUserId } from '@/lib/server/request-user';
import { upgradeAccountBodySchema } from '@/schemas/api/auth/upgrade-account';
import { upgradeAnonymousAccount } from '@/services/user/users.service';
import { type NextRequest } from 'next/server';

/** 把当前匿名账号升级为可登录账号（补密码，账号名与昵称可就地改）。 */
export const POST = withApiHandler(async (req: NextRequest) => {
  const userId = await resolveRequestUserId(req);
  const { account, nickname, password } = await parseJsonBody(upgradeAccountBodySchema, req);
  await upgradeAnonymousAccount(userId, { account, nickname, password });
  return successResponse({});
});
