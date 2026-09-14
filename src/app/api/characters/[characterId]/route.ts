import { successResponse, withApiHandler } from '@/lib/server/api-handler';
import { parseJsonBody, parseRouteParams } from '@/lib/server/parse-schema';
import { resolveRequestUserId } from '@/lib/server/request-user';
import { characterParamsSchema } from '@/schemas/api/characters/params';
import { updateCharacterBodySchema } from '@/schemas/api/characters/patch';
import { getCatalogCharacter } from '@/services/character/catalog.service';
import { updateCharacter } from '@/services/character/update.service';
import { type NextRequest } from 'next/server';

export const GET = withApiHandler(
  async (req: NextRequest, context: RouteContext<'/api/characters/[characterId]'>) => {
    const userId = await resolveRequestUserId(req);
    const { characterId } = await parseRouteParams(characterParamsSchema, context.params);
    const character = await getCatalogCharacter(userId, characterId);
    return successResponse({ character });
  },
);

export const PATCH = withApiHandler(
  async (req: NextRequest, context: RouteContext<'/api/characters/[characterId]'>) => {
    const userId = await resolveRequestUserId(req);
    const { characterId } = await parseRouteParams(characterParamsSchema, context.params);
    const body = await parseJsonBody(updateCharacterBodySchema, req);
    const character = await updateCharacter(userId, characterId, body);
    return successResponse({ character });
  },
);
