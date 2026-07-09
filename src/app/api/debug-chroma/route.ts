import { type NextRequest } from 'next/server';
import {
  getCollectionInfo,
  listAllCollections,
  insertTestData,
  deleteCollection,
  resetCollection,
} from '@/services/debug/chroma.service';
import { successResponse, withApiHandler } from '@/lib/server/api-handler';
import { parseJsonBody, parseSearchParams } from '@/lib/server/parse-schema';
import { debugChromaDeleteQuerySchema } from '@/schemas/api/debug-chroma/delete-query';
import { debugChromaGetQuerySchema } from '@/schemas/api/debug-chroma/get-query';
import { debugChromaPostBodySchema } from '@/schemas/api/debug-chroma/post-body';

/**
 * 【GET】获取数据
 * - /api/debug-chroma            -> 查看所有集合
 * - /api/debug-chroma?name=xxx   -> 查看特定集合详情
 */
export const GET = withApiHandler(async (req: NextRequest) => {
  const query = parseSearchParams(debugChromaGetQuerySchema, req.nextUrl.searchParams);
  const result = query.name
    ? await getCollectionInfo(query.name, query.pageSize)
    : await listAllCollections();
  return successResponse(result);
});

/**
 * 【POST】初始化/添加测试集合与数据
 * - /api/debug-chroma
 */
export const POST = withApiHandler(async (req: NextRequest) => {
  const { name, dataArray } = await parseJsonBody(debugChromaPostBodySchema, req);

  const result = await insertTestData(name, dataArray);
  return successResponse(result);
});

/**
 * 【DELETE】删除指定集合
 * - /api/debug-chroma?name=xxx
 */
export const DELETE = withApiHandler(async (req: NextRequest) => {
  const { name, action } = parseSearchParams(
    debugChromaDeleteQuerySchema,
    req.nextUrl.searchParams,
  );

  if (action === 'reset') {
    const result = await resetCollection(name);
    return successResponse({
      message: `集合 ${name} 中的数据已成功清空（集合本身已保留）。`,
      result,
    });
  }

  const result = await deleteCollection(name);
  return successResponse(result);
});
