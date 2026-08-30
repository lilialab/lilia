import { successResponse, withApiHandler } from '@/lib/server/api-handler';
import { logger } from '@/lib/server/logger';
import { parseSearchParams } from '@/lib/server/parse-schema';
import { memoryMaintainQuerySchema } from '@/schemas/api/memory/maintain';
import { assertIsContact } from '@/services/character/contacts.service';
import { prepareMemoryJob } from '@/services/memory/job.service';
import { runMaintain } from '@/services/memory/maintain.service';
import { resolveUserIdByUsername } from '@/services/user/users.service';
import { randomUUID } from 'crypto';
import { type NextRequest } from 'next/server';

export const POST = withApiHandler(async (req: NextRequest) => {
  const { username, characterId } = parseSearchParams(
    memoryMaintainQuerySchema,
    req.nextUrl.searchParams,
  );
  const userId = await resolveUserIdByUsername(username);
  await assertIsContact(userId, characterId);

  const jobId = randomUUID();
  const job = await prepareMemoryJob(jobId, 'maintain');

  runMaintain(job, userId, characterId).catch((err) => {
    logger.error(
      { jobId, userId, characterId, username, err },
      '[API] runMaintain uncaught error',
    );
  });

  return successResponse({ jobId });
});
