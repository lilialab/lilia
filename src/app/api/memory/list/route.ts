import { successResponse, withApiHandler } from '@/lib/server/api-handler';
import { parseSearchParams } from '@/lib/server/parse-schema';
import { listMemoryQuerySchema } from '@/schemas/api/memory/list';
import { listUserMemories } from '@/services/memory/memory-lifecycle.service';
import { resolveUserIdByUsername } from '@/services/user/users.service';
import { type NextRequest } from 'next/server';

export const GET = withApiHandler(async (req: NextRequest) => {
  const query = parseSearchParams(listMemoryQuerySchema, req.nextUrl.searchParams);
  const userId = await resolveUserIdByUsername(query.username);

  const memories = await listUserMemories({
    userId,
    text: query.text,
    type: query.type,
    isMaintained: query.isMaintained,
    limit: query.limit,
  });

  return successResponse({ memories });
});
