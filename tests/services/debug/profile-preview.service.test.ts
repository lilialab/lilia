import { listProfileFixtures } from '@/services/debug/profile-preview.service';
import { describe, expect, it } from 'vitest';

describe('listProfileFixtures', () => {
  it('含 preach 夹具且参考记忆非空', () => {
    const fixtures = listProfileFixtures();
    const preach = fixtures.find((fixture) => fixture.id === 'preach');
    expect(preach).toBeDefined();
    expect(preach?.referenceMemories.length).toBeGreaterThan(0);
    expect(preach?.referenceMemories.every((memory) => memory.text && memory.type)).toBe(true);
  });
});
