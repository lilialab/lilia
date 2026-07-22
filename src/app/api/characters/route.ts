import { successResponse, withApiHandler } from '@/lib/server/api-handler';
import { resolveRequestUserId } from '@/lib/server/request-user';
import { listCharacters } from '@/services/character/contacts.service';
import { type NextRequest } from 'next/server';

export const GET = withApiHandler(async (req: NextRequest) => {
  await resolveRequestUserId(req);
  const characters = await listCharacters();
  return successResponse({ characters });
});
