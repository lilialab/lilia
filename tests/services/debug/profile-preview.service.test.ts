import { listProfileFixtures } from '@/services/debug/profile-preview.service';
import { describe, expect, it } from 'vitest';

describe('listProfileFixtures', () => {
  it('含填满中文夹具且参考记忆非空', () => {
    const fillZh = listProfileFixtures().find((fixture) => fixture.id === 'fill-zh');
    expect(fillZh).toBeDefined();
    expect(fillZh?.label).toBe('填满 · 中文');
    expect(fillZh?.existing.avoid_topics).toEqual(['政治']);
    expect(fillZh?.referenceMemories.length).toBeGreaterThan(0);
    expect(fillZh?.referenceMemories.every((memory) => memory.text && memory.type)).toBe(true);
  });

  it('含更新三项中文夹具且三项均有现有值', () => {
    const updateZh = listProfileFixtures().find((fixture) => fixture.id === 'update-zh');
    expect(updateZh).toBeDefined();
    expect(updateZh?.label).toBe('更新三项 · 中文');
    expect(updateZh?.existing.communication_style).toBeTruthy();
    expect(updateZh?.existing.avoid_topics?.length).toBeGreaterThan(0);
    expect(updateZh?.existing.now).toBeTruthy();
    expect(updateZh?.referenceMemories.length).toBeGreaterThan(0);
  });

  it('含更新三项英文夹具且参考记忆为英文', () => {
    const updateEn = listProfileFixtures().find((fixture) => fixture.id === 'update-en');
    expect(updateEn).toBeDefined();
    expect(updateEn?.label).toBe('更新三项 · 英文');
    expect(updateEn?.existing.communication_style).toBeTruthy();
    expect(updateEn?.referenceMemories.length).toBeGreaterThan(0);
    expect(
      updateEn?.referenceMemories.every((memory) =>
        memory.text.startsWith('The user') && !/\p{Script=Han}/u.test(memory.text)
      ),
    ).toBe(true);
  });
});
