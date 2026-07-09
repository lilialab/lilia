import { z } from 'zod';

function isMarkdownFile(value: unknown): value is File {
  return value instanceof File && value.name.endsWith('.md');
}

export const uploadPostBodySchema = z.object({
  file: z.custom<File>(isMarkdownFile, { message: '请上传有效的 Markdown 文件' }),
});

export type UploadPostBody = z.infer<typeof uploadPostBodySchema>;
