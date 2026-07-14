import { type NextRequest } from 'next/server';
import { successResponse, withApiHandler } from '@/lib/server/api-handler';
import { AppError } from '@/lib/server/app-error';
import { parseSearchParams } from '@/lib/server/parse-schema';
import { prisma } from '@/lib/server/prisma';
import { memoryConsolidateQuerySchema } from '@/schemas/api/memory/consolidate';
import { scheduleMemoryExtract } from '@/services/memory/extract-queue.service';
import { assertSessionOwnedByUser } from '@/services/session/sessions.service';
import { resolveUserIdByUsername } from '@/services/user/users.service';

/** 列出该用户下仍有未整理消息的会话 id。 */
async function listSessionIdsWithPendingMessages(userId: string): Promise<string[]> {
  const rows = await prisma.message.findMany({
    where: {
      isConsolidated: false,
      session: { userId },
    },
    distinct: ['sessionId'],
    select: { sessionId: true },
  });
  return rows.map((row) => row.sessionId);
}

export const POST = withApiHandler(async (req: NextRequest) => {
  const { username, sessionId } = parseSearchParams(
    memoryConsolidateQuerySchema,
    req.nextUrl.searchParams,
  );
  const userId = await resolveUserIdByUsername(username);

  if (sessionId) {
    await assertSessionOwnedByUser(sessionId, userId);
    const scheduled = await scheduleMemoryExtract(sessionId, userId, { delayMs: 0 });
    return successResponse({
      jobs: [{ sessionId, ...scheduled }],
      queued: true,
    });
  }

  const sessionIds = await listSessionIdsWithPendingMessages(userId);
  if (sessionIds.length === 0) {
    throw AppError.badRequest('没有可整理的未整理消息');
  }

  const jobs = [];
  for (const id of sessionIds) {
    const scheduled = await scheduleMemoryExtract(id, userId, { delayMs: 0 });
    jobs.push({ sessionId: id, ...scheduled });
  }

  return successResponse({ jobs, queued: true });
});
