import { listMaintainFixtures } from '@/services/debug/maintain-preview.service';
import { describe, expect, it } from 'vitest';

describe('listMaintainFixtures', () => {
  it('含近义合并中文夹具且 cursor / neighbors 非空', () => {
    const mergeZh = listMaintainFixtures().find((fixture) => fixture.id === 'merge-zh');
    expect(mergeZh).toBeDefined();
    expect(mergeZh?.label).toBe('近义合并 · 中文');
    expect(mergeZh?.cursor.text.length).toBeGreaterThan(0);
    expect(mergeZh?.neighbors.length).toBeGreaterThan(0);
  });

  it('含近义合并英文夹具且 cursor 为英文', () => {
    const mergeEn = listMaintainFixtures().find((fixture) => fixture.id === 'merge-en');
    expect(mergeEn).toBeDefined();
    expect(mergeEn?.label).toBe('近义合并 · 英文');
    expect(mergeEn?.neighbors.length).toBeGreaterThan(0);
    expect(mergeEn?.cursor.text).toMatch(/^The user /);
    expect(/\p{Script=Han}/u.test(mergeEn?.cursor.text ?? '')).toBe(false);
  });

  it('含独立事实中文夹具', () => {
    const distinctZh = listMaintainFixtures().find((fixture) => fixture.id === 'distinct-zh');
    expect(distinctZh).toBeDefined();
    expect(distinctZh?.label).toBe('独立事实 · 中文');
    expect(distinctZh?.neighbors.length).toBeGreaterThan(0);
  });
});
