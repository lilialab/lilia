import { successResponse, withApiHandler } from '@/lib/server/api-handler';
import { parseJsonBody, parseRouteParams } from '@/lib/server/parse-schema';
import { resolveRequestUserId } from '@/lib/server/request-user';
import { updateCharacterListedBodySchema } from '@/schemas/api/characters/listed-patch';
import { characterParamsSchema } from '@/schemas/api/characters/params';
import { setCharacterListed } from '@/services/character/catalog.service';
import { type NextRequest } from 'next/server';

export const PATCH = withApiHandler(
  async (req: NextRequest, context: RouteContext<'/api/characters/[characterId]/listed'>) => {
    const userId = await resolveRequestUserId(req);
    const { characterId } = await parseRouteParams(characterParamsSchema, context.params);
    const { isListed } = await parseJsonBody(updateCharacterListedBodySchema, req);
    const character = await setCharacterListed(userId, characterId, isListed);
    return successResponse({ character });
  },
);
