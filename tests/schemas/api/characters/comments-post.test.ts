import {
  COMMENT_BODY_MAX_LENGTH,
  createCharacterCommentBodySchema,
} from '@/schemas/api/characters/comments-post';
import { describe, expect, it } from 'vitest';

describe('createCharacterCommentBodySchema', () => {
  it('接受非空正文并 trim', () => {
    expect(createCharacterCommentBodySchema.parse({ body: '  好看  ' })).toEqual({
      body: '好看',
    });
  });

  it('拒绝空正文', () => {
    expect(() => createCharacterCommentBodySchema.parse({ body: '  ' })).toThrow();
  });

  it('拒绝超长正文', () => {
    expect(() =>
      createCharacterCommentBodySchema.parse({ body: '啊'.repeat(COMMENT_BODY_MAX_LENGTH + 1) })
    ).toThrow();
  });
});
