import { parseCharacterProfile, parseCharacterSkills } from '@/services/character/definition.utils';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const CATALOG_PATH = path.join(process.cwd(), 'prisma/characters.json');

describe('prisma/characters.json', () => {
  it('每条含 slug，且 profile/skills/extract 可解析', () => {
    const parsed: unknown = JSON.parse(readFileSync(CATALOG_PATH, 'utf8'));
    expect(Array.isArray(parsed)).toBe(true);
    expect((parsed as unknown[]).length).toBeGreaterThan(0);

    const slugs = new Set<string>();
    for (const entry of parsed as Record<string, unknown>[]) {
      expect(typeof entry.slug).toBe('string');
      expect((entry.slug as string).trim().length).toBeGreaterThan(0);
      expect(slugs.has(entry.slug as string)).toBe(false);
      slugs.add(entry.slug as string);

      const profile = parseCharacterProfile(entry.profile);
      expect(profile.name.length).toBeGreaterThan(0);
      expect(parseCharacterSkills(entry.skills)).toEqual(expect.any(Array));
      expect(typeof entry.extract).toBe('string');
      expect((entry.extract as string).trim().length).toBeGreaterThan(0);
    }

    expect(slugs.has('lilia')).toBe(true);
  });
});
