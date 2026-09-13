import { withApiHandler } from '@/lib/server/api-handler';
import { parseRouteParams } from '@/lib/server/parse-schema';
import { resolveRequestUserId } from '@/lib/server/request-user';
import { contactCharacterParamsSchema } from '@/schemas/api/contacts/params';
import { getCharacterAvatar } from '@/services/character/avatar.service';
import { type NextRequest, NextResponse } from 'next/server';

export const GET = withApiHandler(
  async (req: NextRequest, context: RouteContext<'/api/characters/[characterId]/avatar'>) => {
    await resolveRequestUserId(req);
    const { characterId } = await parseRouteParams(contactCharacterParamsSchema, context.params);
    const avatar = await getCharacterAvatar(characterId);
    return new NextResponse(Buffer.from(avatar.body), {
      headers: {
        'Content-Type': avatar.contentType,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  },
);
