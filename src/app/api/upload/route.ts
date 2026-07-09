import { type NextRequest } from 'next/server';
import { importMarkdownFile } from '@/services/knowledge/knowledge.service';
import { successResponse, withApiHandler } from '@/lib/server/api-handler';
import { parseInput } from '@/lib/server/parse-schema';
import { uploadPostBodySchema } from '@/schemas/api/upload/post';

export const POST = withApiHandler(async (req: NextRequest) => {
  const formData = await req.formData();
  const { file } = parseInput(uploadPostBodySchema, { file: formData.get('file') });

  const result = await importMarkdownFile(file);

  return successResponse(result);
});
