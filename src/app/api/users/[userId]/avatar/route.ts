import { withApiHandler } from '@/lib/server/api-handler';
import { parseRouteParams } from '@/lib/server/parse-schema';
import { resolveRequestUserId } from '@/lib/server/request-user';
import { userParamsSchema } from '@/schemas/api/users/params';
import { getUserAvatar } from '@/services/user/avatar.service';
import { type NextRequest, NextResponse } from 'next/server';

export const GET = withApiHandler(
  async (req: NextRequest, context: RouteContext<'/api/users/[userId]/avatar'>) => {
    await resolveRequestUserId(req);
    const { userId } = await parseRouteParams(userParamsSchema, context.params);
    const avatar = await getUserAvatar(userId);
    return new NextResponse(Buffer.from(avatar.body), {
      headers: {
        'Content-Type': avatar.contentType,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  },
);
