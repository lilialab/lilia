import { describe, expect, it } from 'vitest';
import {
  buildMaintenanceClusterDeleteIds,
  isMaintenanceCursorCandidate,
  mapMaintenanceRewriteOutput,
  parseMaintenanceMemoryItem,
  validateMaintenanceRewriteOutput,
} from '@/services/memory/maintenance.utils';

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
  const watermark = new Date('2026-06-25T12:00:00.000Z');

  it('accepts unmaintained memory after watermark', () => {
    expect(
      isMaintenanceCursorCandidate(
        new Date('2026-06-25T13:00:00.000Z'),
        false,
        false,
        watermark,
      ),
    ).toBe(true);
  });

  it('rejects unmaintained memory at or before watermark', () => {
    expect(
      isMaintenanceCursorCandidate(
        new Date('2026-06-25T12:00:00.000Z'),
        false,
        false,
        watermark,
      ),
    ).toBe(false);
  });

  it('accepts any unmaintained memory when watermark is null', () => {
    expect(
      isMaintenanceCursorCandidate(
        new Date('2026-01-01T00:00:00.000Z'),
        false,
        false,
        null,
      ),
    ).toBe(true);
  });

  it('rejects maintained or deleted memories', () => {
    expect(
      isMaintenanceCursorCandidate(
        new Date('2026-06-26T00:00:00.000Z'),
        true,
        false,
        watermark,
      ),
    ).toBe(false);
    expect(
      isMaintenanceCursorCandidate(
        new Date('2026-06-26T00:00:00.000Z'),
        false,
        true,
        watermark,
      ),
    ).toBe(false);
  });
});
