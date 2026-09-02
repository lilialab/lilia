import { successResponse, withApiHandler } from '@/lib/server/api-handler';
import { assertDevelopmentDebug } from '@/lib/server/debug-guard';
import { logger } from '@/lib/server/logger';
import { parseSearchParams } from '@/lib/server/parse-schema';
import { memoryProfileQuerySchema } from '@/schemas/api/debug/memory/profile';
import { assertIsContact } from '@/services/character/contacts.service';
import { prepareMemoryJob } from '@/services/memory/job.service';
import { runProfileRefresh } from '@/services/memory/user-profile.service';
import { resolveUserIdByUsername } from '@/services/user/users.service';
import { randomUUID } from 'crypto';
import { type NextRequest } from 'next/server';

/** 立即跑画像刷新（不经 Bull）；development 专用。 */
export const POST = withApiHandler(async (req: NextRequest) => {
  assertDevelopmentDebug();
  const { username, characterId } = parseSearchParams(
    memoryProfileQuerySchema,
    req.nextUrl.searchParams,
  );
  const userId = await resolveUserIdByUsername(username);
  await assertIsContact(userId, characterId);

  const jobId = randomUUID();
  const job = await prepareMemoryJob(jobId, 'profile');

  runProfileRefresh(job, userId, characterId).catch((err) => {
    logger.error(
      { jobId, userId, characterId, username, err },
      '[API] runProfileRefresh uncaught error',
    );
  });

  return successResponse({ jobId });
});
