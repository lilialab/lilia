import { xmlBlock } from '@/utils/xml-block';
import { describe, expect, it } from 'vitest';

describe('xmlBlock', () => {
  it('写出开闭标签', () => {
    expect(xmlBlock('persona', 'hello')).toBe('<persona>\nhello\n</persona>');
  });
});
