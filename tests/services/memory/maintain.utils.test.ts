import { env } from '@/lib/server/env';
import { decay, getHalfLifeDays } from '@/services/memory/decay.utils';
import {
  buildMaintainClusterDeleteIds,
  buildMaintainPrompt,
  isMaintainCursorCandidate,
  isMaintainNeighborActive,
  mapMaintainRewriteOutput,
  parseMaintainMemoryItem,
  validateMaintainRewriteOutput,
} from '@/services/memory/maintain.utils';
import { describe, expect, it } from 'vitest';

const DAY_MS = 1000 * 60 * 60 * 24;
const BASE = Date.parse('2026-01-01T00:00:00Z');

describe('parseMaintainMemoryItem', () => {
  it('returns object for valid item', () => {
    expect(
      parseMaintainMemoryItem({
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
      parseMaintainMemoryItem({
        text: '   ',
        type: 'fact',
        confidence: 0.8,
      }),
    ).toBeNull();
  });
});

describe('mapMaintainRewriteOutput', () => {
  it('filters invalid items', () => {
    expect(
      mapMaintainRewriteOutput({
        memories: [
          { text: '用户喜欢跑步', type: 'preference', confidence: 0.9 },
          { text: '', type: 'fact', confidence: 0.8 },
        ],
      }),
    ).toEqual([{ text: '用户喜欢跑步', type: 'preference', confidence: 0.9 }]);
  });
});

describe('validateMaintainRewriteOutput', () => {
  it('rejects empty memories', () => {
    expect(validateMaintainRewriteOutput([], 3).ok).toBe(false);
  });

  it('rejects when output count exceeds input count', () => {
    expect(
      validateMaintainRewriteOutput(
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
      validateMaintainRewriteOutput(
        [{ text: '用户喜欢咖啡', type: 'preference', confidence: 0.9 }],
        3,
      ),
    ).toEqual({ ok: true });
  });
});

describe('buildMaintainClusterDeleteIds', () => {
  it('includes cursor and all neighbor ids without duplicates', () => {
    expect(
      buildMaintainClusterDeleteIds('cursor', ['old1', 'old2', 'old1']),
    ).toEqual(['cursor', 'old1', 'old2']);
  });

  it('returns only cursor when there are no neighbors', () => {
    expect(buildMaintainClusterDeleteIds('cursor', [])).toEqual(['cursor']);
  });
});

describe('isMaintainCursorCandidate', () => {
  it('accepts unmaintained active memory', () => {
    expect(isMaintainCursorCandidate(false, false)).toBe(true);
  });

  it('rejects maintained or deleted memories', () => {
    expect(isMaintainCursorCandidate(true, false)).toBe(false);
    expect(isMaintainCursorCandidate(false, true)).toBe(false);
  });
});

describe('isMaintainNeighborActive', () => {
  it('returns true when lastActiveAt is now', () => {
    expect(isMaintainNeighborActive(BASE, BASE, 'fact')).toBe(true);
  });

  it('keeps event neighbor near 2× half-life boundary and drops below', () => {
    const halfLife = getHalfLifeDays('event');
    const minDecay = env.MEMORY_MAINTAIN_NEIGHBOR_MIN_DECAY;
    const justAbove = BASE + Math.floor(1.99 * halfLife * DAY_MS);
    const justBelow = BASE + Math.ceil(2.01 * halfLife * DAY_MS);

    expect(decay(BASE, justAbove, halfLife)).toBeGreaterThanOrEqual(minDecay);
    expect(isMaintainNeighborActive(BASE, justAbove, 'event')).toBe(true);

    expect(decay(BASE, justBelow, halfLife)).toBeLessThan(minDecay);
    expect(isMaintainNeighborActive(BASE, justBelow, 'event')).toBe(false);
  });

  it('returns false for long-idle preference', () => {
    const now = BASE + 400 * DAY_MS;
    expect(isMaintainNeighborActive(BASE, now, 'preference')).toBe(false);
  });
});

describe('buildMaintainPrompt', () => {
  it('序号 1 为游标，近邻带 distance', () => {
    const prompt = buildMaintainPrompt(
      { text: '用户喜欢咖啡', type: 'preference', confidence: 0.9 },
      [{ text: '用户常点美式', type: 'preference', confidence: 0.8, distance: 0.12 }],
    );
    expect(prompt).toContain('1. [cursor, preference, confidence=0.90] 用户喜欢咖啡');
    expect(prompt).toContain(
      '2. [neighbor, distance=0.120, preference, confidence=0.80] 用户常点美式',
    );
  });
});
