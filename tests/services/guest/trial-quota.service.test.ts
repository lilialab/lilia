import { API_ERROR_CODE } from '@/types/api-error';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { assertRateLimitsMock, redisGetMock } = vi.hoisted(() => ({
  assertRateLimitsMock: vi.fn(),
  redisGetMock: vi.fn(),
}));

vi.mock('@/lib/server/rate-limit', () => ({
  assertRateLimits: assertRateLimitsMock,
}));

vi.mock('@/lib/server/redis', () => ({
  getRedisConnection: () => ({
    get: redisGetMock,
  }),
}));

vi.mock('@/lib/server/env', () => ({
  env: {
    GUEST_TRIAL_DAILY_TURN_LIMIT: 10,
  },
}));

import {
  assertGuestTrialDailyTurnQuota,
  getGuestTrialDailyTurnUsage,
  GUEST_TRIAL_DAILY_TURN_LIMIT_MESSAGE,
} from '@/services/guest/trial-quota.service';

describe('assertGuestTrialDailyTurnQuota', () => {
  beforeEach(() => {
    assertRateLimitsMock.mockReset();
    assertRateLimitsMock.mockResolvedValue(undefined);
  });

  it('按 guestId 与 UTC 日消耗配额，TTL 到下一个 UTC 午夜', async () => {
    await assertGuestTrialDailyTurnQuota(
      'guest-abc',
      new Date('2026-09-17T12:00:00.000Z'),
    );

    expect(assertRateLimitsMock).toHaveBeenCalledWith([
      {
        key: 'ratelimit:guest-trial:daily:guest-abc:2026-09-17',
        limit: 10,
        windowSeconds: 43200,
        message: GUEST_TRIAL_DAILY_TURN_LIMIT_MESSAGE,
        code: API_ERROR_CODE.GUEST_TRIAL_DAILY_TURN_LIMIT,
      },
    ]);
  });
});

describe('getGuestTrialDailyTurnUsage', () => {
  beforeEach(() => {
    redisGetMock.mockReset();
  });

  it('无 key 时 used=0', async () => {
    redisGetMock.mockResolvedValue(null);
    await expect(
      getGuestTrialDailyTurnUsage('guest-abc', new Date('2026-09-17T12:00:00.000Z')),
    ).resolves.toEqual({ used: 0, limit: 10, remaining: 10 });
  });

  it('已用次数换算 remaining', async () => {
    redisGetMock.mockResolvedValue('7');
    await expect(
      getGuestTrialDailyTurnUsage('guest-abc', new Date('2026-09-17T12:00:00.000Z')),
    ).resolves.toEqual({ used: 7, limit: 10, remaining: 3 });
  });
});
