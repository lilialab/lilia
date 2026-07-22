import { type NextRequest } from 'next/server';
import { withApiHandler, successResponse } from '@/lib/server/api-handler';
import { parseJsonBody } from '@/lib/server/parse-schema';
import { resolveRequestUserId } from '@/lib/server/request-user';
import { createGroupBodySchema } from '@/schemas/api/groups/post';
import { createGroup, listGroups } from '@/services/group/groups.service';

export const GET = withApiHandler(async (req: NextRequest) => {
  const userId = await resolveRequestUserId(req);
  const groups = await listGroups(userId);
  return successResponse({ groups });
});

export const POST = withApiHandler(async (req: NextRequest) => {
  const userId = await resolveRequestUserId(req);
  const body = await parseJsonBody(createGroupBodySchema, req);
  const group = await createGroup(userId, body);
  return successResponse({ group });
});
