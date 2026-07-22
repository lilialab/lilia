import { describe, expect, it } from 'vitest';
import { collectTextParts, extractTextFromParts } from '@/lib/message-parts';

describe('collectTextParts', () => {
  it('非数组返回空', () => {
    expect(collectTextParts(null)).toEqual([]);
    expect(collectTextParts(undefined)).toEqual([]);
  });

  it('只保留 trim 后非空的 text part', () => {
    expect(
      collectTextParts([
        { type: 'reasoning', text: 'think' },
        { type: 'text', text: '  hello  ' },
        { type: 'text', text: '   ' },
        { type: 'text', text: 'world' },
      ]),
    ).toEqual([
      { type: 'text', text: 'hello' },
      { type: 'text', text: 'world' },
    ]);
  });
});

describe('extractTextFromParts', () => {
  it('拼成多行正文', () => {
    expect(
      extractTextFromParts([
        { type: 'text', text: 'a' },
        { type: 'reasoning', text: 'x' },
        { type: 'text', text: 'b' },
      ]),
    ).toBe('a\nb');
  });
});
