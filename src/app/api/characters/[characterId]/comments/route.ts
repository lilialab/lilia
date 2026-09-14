import { successResponse, withApiHandler } from '@/lib/server/api-handler';
import { parseJsonBody, parseRouteParams } from '@/lib/server/parse-schema';
import { resolveRequestUserId } from '@/lib/server/request-user';
import { createCharacterCommentBodySchema } from '@/schemas/api/characters/comments-post';
import { characterParamsSchema } from '@/schemas/api/characters/params';
import {
  createCharacterComment,
  listCharacterComments,
} from '@/services/character/comments.service';
import { type NextRequest } from 'next/server';

export const GET = withApiHandler(
  async (req: NextRequest, context: RouteContext<'/api/characters/[characterId]/comments'>) => {
    await resolveRequestUserId(req);
    const { characterId } = await parseRouteParams(characterParamsSchema, context.params);
    const comments = await listCharacterComments(characterId);
    return successResponse({ comments });
  },
);

export const POST = withApiHandler(
  async (req: NextRequest, context: RouteContext<'/api/characters/[characterId]/comments'>) => {
    const userId = await resolveRequestUserId(req);
    const { characterId } = await parseRouteParams(characterParamsSchema, context.params);
    const { body } = await parseJsonBody(createCharacterCommentBodySchema, req);
    const comment = await createCharacterComment(userId, characterId, body);
    return successResponse({ comment });
  },
);
