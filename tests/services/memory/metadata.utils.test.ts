import {
  parseConfidence,
  parseLastActiveAt,
  parseMemoryMetadata,
} from '@/services/memory/metadata.utils';
import { describe, expect, it } from 'vitest';

const FALLBACK_MS = 1_700_000_000_000;

describe('parseConfidence', () => {
  it('returns valid confidence', () => {
    expect(parseConfidence(0.85)).toBe(0.85);
  });

  it('returns default for invalid values', () => {
    expect(parseConfidence('0.8')).toBe(0.7);
    expect(parseConfidence(NaN)).toBe(0.7);
    expect(parseConfidence(undefined)).toBe(0.7);
  });
});

describe('parseLastActiveAt', () => {
  it('prefers last_active_at over timestamp', () => {
    const meta = { last_active_at: 100, timestamp: 200 };
    expect(parseLastActiveAt(meta, FALLBACK_MS)).toBe(100);
  });

  it('falls back to timestamp when last_active_at is missing', () => {
    const meta = { timestamp: 200 };
    expect(parseLastActiveAt(meta, FALLBACK_MS)).toBe(200);
  });

  it('falls back to provided now when metadata is empty', () => {
    expect(parseLastActiveAt(null, FALLBACK_MS)).toBe(FALLBACK_MS);
    expect(parseLastActiveAt({}, FALLBACK_MS)).toBe(FALLBACK_MS);
  });
});

describe('parseMemoryMetadata', () => {
  it('parses complete metadata', () => {
    const result = parseMemoryMetadata(
      {
        type: 'fact',
        confidence: 0.9,
        last_active_at: 100,
        timestamp: 50,
      },
      FALLBACK_MS,
    );

    expect(result).toEqual({
      type: 'fact',
      confidence: 0.9,
      lastActiveAt: 100,
    });
  });

  it('applies defaults for partial metadata', () => {
    const result = parseMemoryMetadata({ timestamp: 200 }, FALLBACK_MS);

    expect(result).toEqual({
      type: undefined,
      confidence: 0.7,
      lastActiveAt: 200,
    });
  });
});
