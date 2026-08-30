import { successResponse, withApiHandler } from '@/lib/server/api-handler';
import { assertDevelopmentDebug } from '@/lib/server/debug-guard';
import { parseJsonBody } from '@/lib/server/parse-schema';
import { debugExtractPostBodySchema } from '@/schemas/api/debug/extract/post-body';
import { getExtractDebugMeta, previewExtract } from '@/services/debug/extract-preview.service';
import { type NextRequest } from 'next/server';

export const maxDuration = 120;

/** 提取调试元数据：角色列表与 JSON 夹具。 */
export const GET = withApiHandler(async () => {
  assertDevelopmentDebug();
  return successResponse(getExtractDebugMeta());
});

/** 提取 dry-run，不写库。 */
export const POST = withApiHandler(async (req: NextRequest) => {
  assertDevelopmentDebug();
  const { characterSlug, messages } = await parseJsonBody(debugExtractPostBodySchema, req);
  const result = await previewExtract(characterSlug, messages);
  return successResponse(result);
});
