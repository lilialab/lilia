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
    CHAT_DAILY_TURN_LIMIT: 10,
  },
}));

import {
  assertChatDailyTurnQuota,
  CHAT_DAILY_TURN_LIMIT_MESSAGE,
  getChatDailyTurnUsage,
} from '@/services/chat/quota.service';

describe('assertChatDailyTurnQuota', () => {
  beforeEach(() => {
    assertRateLimitsMock.mockReset();
    assertRateLimitsMock.mockResolvedValue(undefined);
  });

  it('按用户与 UTC 日消耗配额，TTL 到下一个 UTC 午夜', async () => {
    await assertChatDailyTurnQuota('user-1', new Date('2026-08-24T12:00:00.000Z'));

    expect(assertRateLimitsMock).toHaveBeenCalledWith([
      {
        key: 'ratelimit:chat:daily:user-1:2026-08-24',
        limit: expect.any(Number),
        windowSeconds: 43200,
        message: CHAT_DAILY_TURN_LIMIT_MESSAGE,
        code: API_ERROR_CODE.CHAT_DAILY_TURN_LIMIT,
      },
    ]);
  });
});

describe('getChatDailyTurnUsage', () => {
  beforeEach(() => {
    redisGetMock.mockReset();
  });

  it('读同一个日配额 key；无 key 时 used=0', async () => {
    redisGetMock.mockResolvedValue(null);

    await expect(
      getChatDailyTurnUsage('user-1', new Date('2026-08-24T12:00:00.000Z')),
    ).resolves.toEqual({ used: 0, limit: 10, remaining: 10 });
    expect(redisGetMock).toHaveBeenCalledWith('ratelimit:chat:daily:user-1:2026-08-24');
  });

  it('已用次数换算 remaining', async () => {
    redisGetMock.mockResolvedValue('7');

    await expect(
      getChatDailyTurnUsage('user-1', new Date('2026-08-24T12:00:00.000Z')),
    ).resolves.toEqual({ used: 7, limit: 10, remaining: 3 });
  });

  it('已用超上限时 remaining 取 0', async () => {
    redisGetMock.mockResolvedValue('12');

    await expect(
      getChatDailyTurnUsage('user-1', new Date('2026-08-24T12:00:00.000Z')),
    ).resolves.toEqual({ used: 12, limit: 10, remaining: 0 });
  });
});
