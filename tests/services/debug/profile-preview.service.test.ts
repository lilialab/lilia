import { listProfileFixtures } from '@/services/debug/profile-preview.service';
import { describe, expect, it } from 'vitest';

describe('listProfileFixtures', () => {
  it('含 multiple 夹具且参考记忆非空', () => {
    const fixtures = listProfileFixtures();
    const multiple = fixtures.find((fixture) => fixture.id === 'multiple');
    expect(multiple).toBeDefined();
    expect(multiple?.existing.avoid_topics).toEqual(['政治']);
    expect(multiple?.referenceMemories.length).toBeGreaterThan(0);
    expect(multiple?.referenceMemories.every((memory) => memory.text && memory.type)).toBe(true);
  });

  it('含 update 夹具且三项均有现有值', () => {
    const fixtures = listProfileFixtures();
    const update = fixtures.find((fixture) => fixture.id === 'update');
    expect(update).toBeDefined();
    expect(update?.existing.communication_style).toBeTruthy();
    expect(update?.existing.avoid_topics?.length).toBeGreaterThan(0);
    expect(update?.existing.now).toBeTruthy();
    expect(update?.referenceMemories.length).toBeGreaterThan(0);
  });
});
