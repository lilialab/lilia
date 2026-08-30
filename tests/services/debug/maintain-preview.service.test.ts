import { listMaintainFixtures } from '@/services/debug/maintain-preview.service';
import { describe, expect, it } from 'vitest';

describe('listMaintainFixtures', () => {
  it('含 merge 夹具且 cursor / neighbors 非空', () => {
    const fixtures = listMaintainFixtures();
    const merge = fixtures.find((fixture) => fixture.id === 'merge');
    expect(merge).toBeDefined();
    expect(merge?.cursor.text.length).toBeGreaterThan(0);
    expect(merge?.neighbors.length).toBeGreaterThan(0);
  });
});
