import type { AppError } from '@/lib/server/app-error';
import { assertRateLimits } from '@/lib/server/rate-limit';
import { API_ERROR_CODE } from '@/types/api-error';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const evalMock = vi.fn();

vi.mock('@/lib/server/redis', () => ({
  getRedisConnection: () => ({
    eval: evalMock,
  }),
}));

describe('assertRateLimits', () => {
  beforeEach(() => {
    evalMock.mockReset();
  });

  it('未超限时依次检查每个窗口', async () => {
    evalMock.mockResolvedValue(1);

    await assertRateLimits([
      { key: 'a', limit: 5, windowSeconds: 3600 },
      { key: 'b', limit: 15, windowSeconds: 86400 },
    ]);

    expect(evalMock).toHaveBeenCalledTimes(2);
    expect(evalMock).toHaveBeenNthCalledWith(1, expect.any(String), 1, 'a', 3600, 5);
    expect(evalMock).toHaveBeenNthCalledWith(2, expect.any(String), 1, 'b', 86400, 15);
  });

  it('超限时可使用窗口自定义文案与错误码', async () => {
    evalMock.mockResolvedValue(0);

    await expect(
      assertRateLimits([
        {
          key: 'a',
          limit: 1,
          windowSeconds: 60,
          message: '今日对话次数已用完，请明天再试',
          code: API_ERROR_CODE.CHAT_DAILY_TURN_LIMIT,
        },
      ]),
    ).rejects.toMatchObject(
      {
        status: 429,
        code: API_ERROR_CODE.CHAT_DAILY_TURN_LIMIT,
        message: '今日对话次数已用完，请明天再试',
      } satisfies Partial<AppError>,
    );
  });

  it('任一窗口超限时抛 429', async () => {
    evalMock.mockResolvedValueOnce(1).mockResolvedValueOnce(0);

    await expect(
      assertRateLimits([
        { key: 'a', limit: 5, windowSeconds: 3600 },
        { key: 'b', limit: 15, windowSeconds: 86400 },
      ]),
    ).rejects.toMatchObject(
      {
        status: 429,
        code: API_ERROR_CODE.RATE_LIMITED,
        message: '操作太频繁，请稍后再试',
      } satisfies Partial<AppError>,
    );
  });
});
