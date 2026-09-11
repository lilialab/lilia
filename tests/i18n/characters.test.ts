import { tCharacter } from '@/i18n/characters';
import { describe, expect, it } from 'vitest';

describe('tCharacter', () => {
  it('按 slug 与语言取 displayName', () => {
    expect(tCharacter('lilia', 'displayName', 'zh')).toBe('莉莉娅');
    expect(tCharacter('lilia', 'displayName', 'en')).toBe('Lilia');
    expect(tCharacter('rin', 'displayName', 'zh')).toBe('凛');
    expect(tCharacter('rin', 'displayName', 'en')).toBe('Rin');
  });

  it('按 slug 与语言取 shortBio', () => {
    expect(tCharacter('rin', 'shortBio', 'zh')).toContain('嘴毒');
    expect(tCharacter('rin', 'shortBio', 'en')).toContain('Sharp tongue');
  });

  it('未知 slug 回退 slug 本身', () => {
    expect(tCharacter('unknown-bot', 'displayName', 'zh')).toBe('unknown-bot');
    expect(tCharacter('unknown-bot', 'shortBio', 'en')).toBe('unknown-bot');
  });
});
