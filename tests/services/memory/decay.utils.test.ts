import { describe, expect, it } from 'vitest';
import {
  decay,
  effectiveScore,
  getHalfLifeDays,
  similarityFromDistance,
} from '@/services/memory/decay.utils';

const DAY_MS = 1000 * 60 * 60 * 24;
const BASE = Date.parse('2026-01-01T00:00:00Z');

describe('getHalfLifeDays', () => {
  it('returns 30 for event', () => {
    expect(getHalfLifeDays('event')).toBe(30);
  });

  it('returns 90 for preference and fact', () => {
    expect(getHalfLifeDays('preference')).toBe(90);
    expect(getHalfLifeDays('fact')).toBe(90);
    expect(getHalfLifeDays(undefined)).toBe(90);
  });
});

describe('decay', () => {
  it('returns 1 when lastActiveAt is now or future', () => {
    expect(decay(BASE, BASE, 90)).toBe(1);
    expect(decay(BASE + DAY_MS, BASE, 90)).toBe(1);
  });

  it('returns about 0.5 after one half-life', () => {
    const now = BASE + 90 * DAY_MS;
    expect(decay(BASE, now, 90)).toBeCloseTo(0.5, 5);
  });

  it('decays faster for shorter half-life', () => {
    const now = BASE + 30 * DAY_MS;
    const eventDecay = decay(BASE, now, 30);
    const factDecay = decay(BASE, now, 90);
    expect(eventDecay).toBeCloseTo(0.5, 5);
    expect(factDecay).toBeGreaterThan(eventDecay);
  });
});

describe('similarityFromDistance', () => {
  it('returns 1 for zero distance', () => {
    expect(similarityFromDistance(0)).toBe(1);
  });

  it('decreases as distance increases', () => {
    expect(similarityFromDistance(1)).toBe(0.5);
    expect(similarityFromDistance(2)).toBeLessThan(0.5);
  });
});

describe('effectiveScore', () => {
  it('ranks recent high-confidence hits above stale ones', () => {
    const now = BASE + 10 * DAY_MS;
    const recent = effectiveScore(0.2, 0.9, BASE, now, 'preference');
    const stale = effectiveScore(0.2, 0.9, BASE - 180 * DAY_MS, now, 'preference');
    expect(recent).toBeGreaterThan(stale);
  });

  it('ranks closer semantic match higher when decay is equal', () => {
    const now = BASE;
    const closer = effectiveScore(0.1, 0.8, BASE, now, 'fact');
    const farther = effectiveScore(1.0, 0.8, BASE, now, 'fact');
    expect(closer).toBeGreaterThan(farther);
  });
});
