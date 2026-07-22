import { env } from '@/lib/server/env';
import { decay, getHalfLifeDays } from '@/services/memory/decay.utils';
import {
  buildMaintenanceClusterDeleteIds,
  isMaintenanceCursorCandidate,
  isMaintenanceNeighborActive,
  mapMaintenanceRewriteOutput,
  parseMaintenanceMemoryItem,
  validateMaintenanceRewriteOutput,
} from '@/services/memory/maintenance.utils';
import { describe, expect, it } from 'vitest';

const DAY_MS = 1000 * 60 * 60 * 24;
const BASE = Date.parse('2026-01-01T00:00:00Z');

describe('parseMaintenanceMemoryItem', () => {
  it('returns object for valid item', () => {
    expect(
      parseMaintenanceMemoryItem({
        text: '用户喜欢跑步',
        type: 'preference',
        confidence: 0.9,
      }),
    ).toEqual({
      text: '用户喜欢跑步',
      type: 'preference',
      confidence: 0.9,
    });
  });

  it('returns null for empty text', () => {
    expect(
      parseMaintenanceMemoryItem({
        text: '   ',
        type: 'fact',
        confidence: 0.8,
      }),
    ).toBeNull();
  });
});

describe('mapMaintenanceRewriteOutput', () => {
  it('filters invalid items', () => {
    expect(
      mapMaintenanceRewriteOutput({
        memories: [
          { text: '用户喜欢跑步', type: 'preference', confidence: 0.9 },
          { text: '', type: 'fact', confidence: 0.8 },
        ],
      }),
    ).toEqual([{ text: '用户喜欢跑步', type: 'preference', confidence: 0.9 }]);
  });
});

describe('validateMaintenanceRewriteOutput', () => {
  it('rejects empty memories', () => {
    expect(validateMaintenanceRewriteOutput([], 3).ok).toBe(false);
  });

  it('rejects when output count exceeds input count', () => {
    expect(
      validateMaintenanceRewriteOutput(
        [
          { text: 'a', type: 'fact', confidence: 0.8 },
          { text: 'b', type: 'fact', confidence: 0.8 },
        ],
        1,
      ).ok,
    ).toBe(false);
  });

  it('accepts valid output within input count', () => {
    expect(
      validateMaintenanceRewriteOutput(
        [{ text: '用户喜欢咖啡', type: 'preference', confidence: 0.9 }],
        3,
      ),
    ).toEqual({ ok: true });
  });
});

describe('buildMaintenanceClusterDeleteIds', () => {
  it('includes cursor and all neighbor ids without duplicates', () => {
    expect(
      buildMaintenanceClusterDeleteIds('cursor', ['old1', 'old2', 'old1']),
    ).toEqual(['cursor', 'old1', 'old2']);
  });

  it('returns only cursor when there are no neighbors', () => {
    expect(buildMaintenanceClusterDeleteIds('cursor', [])).toEqual(['cursor']);
  });
});

describe('isMaintenanceCursorCandidate', () => {
  it('accepts unmaintained active memory', () => {
    expect(isMaintenanceCursorCandidate(false, false)).toBe(true);
  });

  it('rejects maintained or deleted memories', () => {
    expect(isMaintenanceCursorCandidate(true, false)).toBe(false);
    expect(isMaintenanceCursorCandidate(false, true)).toBe(false);
  });
});

describe('isMaintenanceNeighborActive', () => {
  it('returns true when lastActiveAt is now', () => {
    expect(isMaintenanceNeighborActive(BASE, BASE, 'fact')).toBe(true);
  });

  it('keeps event neighbor near 2× half-life boundary and drops below', () => {
    const halfLife = getHalfLifeDays('event');
    const minDecay = env.MEMORY_MAINTENANCE_NEIGHBOR_MIN_DECAY;
    const justAbove = BASE + Math.floor(1.99 * halfLife * DAY_MS);
    const justBelow = BASE + Math.ceil(2.01 * halfLife * DAY_MS);

    expect(decay(BASE, justAbove, halfLife)).toBeGreaterThanOrEqual(minDecay);
    expect(isMaintenanceNeighborActive(BASE, justAbove, 'event')).toBe(true);

    expect(decay(BASE, justBelow, halfLife)).toBeLessThan(minDecay);
    expect(isMaintenanceNeighborActive(BASE, justBelow, 'event')).toBe(false);
  });

  it('returns false for long-idle preference', () => {
    const now = BASE + 400 * DAY_MS;
    expect(isMaintenanceNeighborActive(BASE, now, 'preference')).toBe(false);
  });
});
