import { tCharacter } from '@/i18n/characters';
import { describe, expect, it } from 'vitest';

describe('tCharacter', () => {
  it('按 slug 与语言取 displayName', () => {
    expect(tCharacter('lilia', 'displayName', 'zh')).toBe('莉莉娅');
    expect(tCharacter('lilia', 'displayName', 'en')).toBe('Lilia');
    expect(tCharacter('lilia', 'displayName', 'ja')).toBe('リリア');
  });

  it('按 slug 与语言取 shortBio', () => {
    expect(tCharacter('einstein', 'shortBio', 'zh')).toContain('思想实验');
    expect(tCharacter('einstein', 'shortBio', 'en')).toContain('Thought experiments');
    expect(tCharacter('einstein', 'shortBio', 'ja')).toContain('思考実験');
    expect(tCharacter('socrates', 'shortBio', 'zh')).toContain('爱追问');
    expect(tCharacter('socrates', 'shortBio', 'en')).toContain('Relentless questions');
    expect(tCharacter('socrates', 'shortBio', 'ja')).toContain('執拗な問い');
  });

  it('未知 slug 回退 slug 本身', () => {
    expect(tCharacter('unknown-bot', 'displayName', 'zh')).toBe('unknown-bot');
    expect(tCharacter('unknown-bot', 'shortBio', 'en')).toBe('unknown-bot');
  });
});
