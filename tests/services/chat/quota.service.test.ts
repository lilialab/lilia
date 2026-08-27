import { API_ERROR_CODE } from '@/types/api-error';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { assertRateLimitsMock } = vi.hoisted(() => ({
  assertRateLimitsMock: vi.fn(),
}));

vi.mock('@/lib/server/rate-limit', () => ({
  assertRateLimits: assertRateLimitsMock,
}));

import {
  assertChatDailyTurnQuota,
  CHAT_DAILY_TURN_LIMIT_MESSAGE,
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
