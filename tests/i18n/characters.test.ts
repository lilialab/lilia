import { tCharacter } from '@/i18n/characters';
import { describe, expect, it } from 'vitest';

describe('tCharacter', () => {
  it('按 slug 与语言取 displayName', () => {
    expect(tCharacter('lilia', 'displayName', 'zh')).toBe('莉莉娅');
    expect(tCharacter('lilia', 'displayName', 'en')).toBe('Lilia');
  });

  it('按 slug 与语言取 shortBio', () => {
    expect(tCharacter('bob', 'shortBio', 'zh')).toContain('占位');
    expect(tCharacter('bob', 'shortBio', 'en')).toContain('Placeholder');
  });

  it('未知 slug 回退 slug 本身', () => {
    expect(tCharacter('unknown-bot', 'displayName', 'zh')).toBe('unknown-bot');
    expect(tCharacter('unknown-bot', 'shortBio', 'en')).toBe('unknown-bot');
  });
});
