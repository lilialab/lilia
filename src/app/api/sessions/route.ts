import { type NextRequest } from 'next/server';
import { withApiHandler, successResponse } from '@/lib/server/api-handler';
import { parseJsonBody } from '@/lib/server/parse-schema';
import { resolveRequestUserId } from '@/lib/server/request-user';
import { createSession, listSessions } from '@/services/session/sessions.service';
import { z } from 'zod';

const createSessionBodySchema = z.object({
  title: z.string().trim().optional(),
});

export const GET = withApiHandler(async (req: NextRequest) => {
  const userId = await resolveRequestUserId(req);
  const sessions = await listSessions(userId);
  return successResponse({ sessions });
});

export const POST = withApiHandler(async (req: NextRequest) => {
  const userId = await resolveRequestUserId(req);
  const { title } = await parseJsonBody(createSessionBodySchema, req);
  const session = await createSession(userId, title);
  return successResponse({ session });
});
