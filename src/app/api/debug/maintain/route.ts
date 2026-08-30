import { successResponse, withApiHandler } from '@/lib/server/api-handler';
import { assertDevelopmentDebug } from '@/lib/server/debug-guard';
import { parseJsonBody } from '@/lib/server/parse-schema';
import { debugMaintainPostBodySchema } from '@/schemas/api/debug/maintain/post-body';
import { getMaintainDebugMeta, previewMaintain } from '@/services/debug/maintain-preview.service';
import { type NextRequest } from 'next/server';

export const maxDuration = 120;

/** 维护调试元数据：JSON 夹具。 */
export const GET = withApiHandler(async () => {
  assertDevelopmentDebug();
  return successResponse(getMaintainDebugMeta());
});

/** 维护 dry-run，不写库。 */
export const POST = withApiHandler(async (req: NextRequest) => {
  assertDevelopmentDebug();
  const { cursor, neighbors } = await parseJsonBody(debugMaintainPostBodySchema, req);
  const result = await previewMaintain(cursor, neighbors);
  return successResponse(result);
});
