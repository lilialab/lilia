import { type NextRequest } from 'next/server';
import { successResponse, withApiHandler } from '@/lib/server/api-handler';
import { parseSearchParams } from '@/lib/server/parse-schema';
import { listMemoryQuerySchema } from '@/schemas/api/memory/list';
import { listUserMemories } from '@/services/memory/memory-lifecycle.service';

export const GET = withApiHandler(async (req: NextRequest) => {
  const query = parseSearchParams(listMemoryQuerySchema, req.nextUrl.searchParams);

  const memories = await listUserMemories(query);

  return successResponse({ memories });
});
