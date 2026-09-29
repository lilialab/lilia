import { successResponse, withApiHandler } from '@/lib/server/api-handler';
import { assertDevelopmentDebug } from '@/lib/server/debug-guard';
import { parseSearchParams } from '@/lib/server/parse-schema';
import { listMemoryQuerySchema } from '@/schemas/api/debug/memory/list';
import { listUserMemories } from '@/services/memory/memory-lifecycle.service';
import { resolveUserIdByAccount } from '@/services/user/users.service';
import { type NextRequest } from 'next/server';

/** 列出已存记忆；development 专用。 */
export const GET = withApiHandler(async (req: NextRequest) => {
  assertDevelopmentDebug();
  const query = parseSearchParams(listMemoryQuerySchema, req.nextUrl.searchParams);
  const userId = await resolveUserIdByAccount(query.account);

  const memories = await listUserMemories({
    userId,
    text: query.text,
    type: query.type,
    isMaintained: query.isMaintained,
    limit: query.limit,
  });

  return successResponse({ memories });
});
