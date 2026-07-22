import { type NextRequest } from 'next/server';
import { withApiHandler, successResponse } from '@/lib/server/api-handler';
import { parseRouteParams } from '@/lib/server/parse-schema';
import { resolveRequestUserId } from '@/lib/server/request-user';
import { contactCharacterParamsSchema } from '@/schemas/api/contacts/params';
import { getOrCreateContactSession } from '@/services/character/contacts.service';

export const GET = withApiHandler(
  async (req: NextRequest, context: RouteContext<'/api/contacts/[characterId]/session'>) => {
    const userId = await resolveRequestUserId(req);
    const { characterId } = await parseRouteParams(contactCharacterParamsSchema, context.params);
    const session = await getOrCreateContactSession(userId, characterId);
    return successResponse(session);
  },
);
