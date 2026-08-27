import { tCharacter } from '@/i18n/characters';
import { interpolate } from '@/prompts/interpolate';
import { loadCharacter } from '@/prompts/load';
import { describe, expect, it } from 'vitest';

describe('interpolate', () => {
  it('按对象 kv 一一替换', () => {
    expect(interpolate('I am {{name}} (@{{slug}}).', { name: 'Lilia', slug: 'lilia' })).toBe(
      'I am Lilia (@lilia).',
    );
  });

  it('无占位符时原文返回', () => {
    expect(interpolate('plain', { name: 'Lilia' })).toBe('plain');
  });

  it('未知变量抛错', () => {
    expect(() => interpolate('Hi {{pronoun}}', { name: 'Lilia' })).toThrow(
      /未知插值变量: \{\{pronoun\}\}/,
    );
  });

  it('不限于 name/slug，任意 key 都可替换', () => {
    expect(interpolate('{{a}}-{{b}}', { a: '1', b: '2' })).toBe('1-2');
  });

  it('人设按 locale 填入 displayName', () => {
    for (const slug of ['lilia', 'einstein', 'socrates'] as const) {
      const raw = loadCharacter(slug).persona;
      const zh = interpolate(raw, { name: tCharacter(slug, 'displayName', 'zh'), slug });
      const en = interpolate(raw, { name: tCharacter(slug, 'displayName', 'en'), slug });
      expect(zh).toContain(`你叫${tCharacter(slug, 'displayName', 'zh')}`);
      expect(en).toContain(`你叫${tCharacter(slug, 'displayName', 'en')}`);
      expect(en).not.toContain('{{name}}');
      if (slug === 'lilia') expect(en).not.toContain('莉莉娅');
    }
  });
});
