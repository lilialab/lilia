import { successResponse, withApiHandler } from '@/lib/server/api-handler';
import { parseJsonBody } from '@/lib/server/parse-schema';
import { resolveRequestUserId } from '@/lib/server/request-user';
import { assertIsContact } from '@/services/character/contacts.service';
import { createSession, listSessions } from '@/services/session/sessions.service';
import { type NextRequest } from 'next/server';
import { z } from 'zod';

const createSessionBodySchema = z.object({
  characterId: z.string().trim().min(1),
  title: z.string().trim().optional(),
});

export const GET = withApiHandler(async (req: NextRequest) => {
  const userId = await resolveRequestUserId(req);
  const sessions = await listSessions(userId);
  return successResponse({ sessions });
});

export const POST = withApiHandler(async (req: NextRequest) => {
  const userId = await resolveRequestUserId(req);
  const { characterId, title } = await parseJsonBody(createSessionBodySchema, req);
  await assertIsContact(userId, characterId);
  const session = await createSession(userId, characterId, title);
  return successResponse({ session });
});
