import {
  GENERATION_LOCK_STALE_MS,
  generationLockStaleBefore,
  isGenerationBusy,
} from '@/services/session/generation-lock.utils';
import { describe, expect, it } from 'vitest';

describe('isGenerationBusy', () => {
  const now = Date.parse('2026-07-25T10:00:00.000Z');

  it('null / undefined 为不忙', () => {
    expect(isGenerationBusy(null, now)).toBe(false);
    expect(isGenerationBusy(undefined, now)).toBe(false);
  });

  it('未过期为忙', () => {
    expect(isGenerationBusy(new Date(now - 1000), now)).toBe(true);
    expect(isGenerationBusy(new Date(now - GENERATION_LOCK_STALE_MS + 1), now)).toBe(true);
  });

  it('已过期为不忙', () => {
    expect(isGenerationBusy(new Date(now - GENERATION_LOCK_STALE_MS), now)).toBe(false);
    expect(isGenerationBusy(new Date(now - GENERATION_LOCK_STALE_MS - 1), now)).toBe(false);
  });
});

describe('generationLockStaleBefore', () => {
  it('相对 now 回退 STALE_MS', () => {
    const now = Date.parse('2026-07-25T10:00:00.000Z');
    expect(generationLockStaleBefore(now).getTime()).toBe(now - GENERATION_LOCK_STALE_MS);
  });
});
