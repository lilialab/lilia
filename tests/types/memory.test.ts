import { isMemoryType } from '@/types/memory';
import { describe, expect, it } from 'vitest';

describe('isMemoryType', () => {
  it('accepts event and fact', () => {
    expect(isMemoryType('event')).toBe(true);
    expect(isMemoryType('fact')).toBe(true);
  });

  it('rejects other values', () => {
    expect(isMemoryType('invalid')).toBe(false);
    expect(isMemoryType(123)).toBe(false);
    expect(isMemoryType(undefined)).toBe(false);
  });
});
