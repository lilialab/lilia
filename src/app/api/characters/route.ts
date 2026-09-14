import { successResponse, withApiHandler } from '@/lib/server/api-handler';
import { parseJsonBody } from '@/lib/server/parse-schema';
import { resolveRequestUserId } from '@/lib/server/request-user';
import { createCharacterBodySchema } from '@/schemas/api/characters/post';
import { listCharacters } from '@/services/character/catalog.service';
import { createCharacter } from '@/services/character/create.service';
import { type NextRequest } from 'next/server';

export const GET = withApiHandler(async (req: NextRequest) => {
  const userId = await resolveRequestUserId(req);
  const characters = await listCharacters(userId);
  return successResponse({ characters });
});

export const POST = withApiHandler(async (req: NextRequest) => {
  const userId = await resolveRequestUserId(req);
  const body = await parseJsonBody(createCharacterBodySchema, req);
  const character = await createCharacter(userId, body);
  return successResponse({ character });
});
