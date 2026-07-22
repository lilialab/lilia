import { uploadPostBodySchema } from '@/schemas/api/upload/post';
import { describe, expect, it } from 'vitest';

describe('uploadPostBodySchema', () => {
  it('非 File 或缺少 .md 后缀解析失败', () => {
    expect(uploadPostBodySchema.safeParse({ file: null }).success).toBe(false);
    expect(
      uploadPostBodySchema.safeParse({ file: { name: 'doc.txt' } }).success,
    ).toBe(false);
  });

  it('合法 .md File 通过校验', () => {
    const file = new File(['# hi'], 'note.md', { type: 'text/markdown' });
    const result = uploadPostBodySchema.safeParse({ file });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.file.name).toBe('note.md');
    }
  });
});
