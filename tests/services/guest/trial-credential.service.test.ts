import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/server/env', () => ({
  env: {
    AUTH_SESSION_SECRET: 'test-guest-trial-secret',
    GUEST_TRIAL_COOKIE_NAME: 'lilia_guest_trial',
  },
}));

vi.mock('@/lib/server/turnstile', () => ({
  verifyTurnstileToken: vi.fn(),
}));

import { verifyTurnstileToken } from '@/lib/server/turnstile';
import { createGuestTrialToken, newGuestTrialId } from '@/services/guest/trial-cookie';
import { issueGuestTrialCredential } from '@/services/guest/trial-credential.service';
import { API_ERROR_CODE } from '@/types/api-error';

describe('issueGuestTrialCredential', () => {
  const now = new Date('2026-09-17T15:00:00.000Z');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('无 cookie 且无 turnstile 时要求人机验证', async () => {
    await expect(
      issueGuestTrialCredential({
        existingToken: null,
        turnstileToken: undefined,
        now,
      }),
    ).rejects.toMatchObject({
      status: 400,
      code: API_ERROR_CODE.TURNSTILE_TOKEN_REQUIRED,
    });
    expect(verifyTurnstileToken).not.toHaveBeenCalled();
  });

  it('校验 Turnstile 后签发今日凭证', async () => {
    vi.mocked(verifyTurnstileToken).mockResolvedValue(undefined);

    const result = await issueGuestTrialCredential({
      existingToken: null,
      turnstileToken: 'cf-turnstile-ok',
      now,
    });

    expect(verifyTurnstileToken).toHaveBeenCalledWith('cf-turnstile-ok');
    expect(result.turnstileUsed).toBe(true);
    expect(result.credential.utcDay).toBe('2026-09-17');
    expect(result.credential.guestId).toMatch(/^[0-9a-f]{32}$/);
    expect(result.token.startsWith(`${result.credential.guestId}.2026-09-17.`)).toBe(true);
  });

  it('已有今日 cookie 时复用且不再验 Turnstile', async () => {
    const guestId = newGuestTrialId();
    const existingToken = createGuestTrialToken(guestId, '2026-09-17');

    const result = await issueGuestTrialCredential({
      existingToken,
      turnstileToken: undefined,
      now,
    });

    expect(verifyTurnstileToken).not.toHaveBeenCalled();
    expect(result).toEqual({
      credential: { guestId, utcDay: '2026-09-17' },
      token: existingToken,
      turnstileUsed: false,
    });
  });

  it('旧日 cookie 必须重新过 Turnstile', async () => {
    vi.mocked(verifyTurnstileToken).mockResolvedValue(undefined);
    const oldToken = createGuestTrialToken(newGuestTrialId(), '2026-09-16');

    const result = await issueGuestTrialCredential({
      existingToken: oldToken,
      turnstileToken: 'fresh-token',
      now,
    });

    expect(verifyTurnstileToken).toHaveBeenCalledWith('fresh-token');
    expect(result.turnstileUsed).toBe(true);
    expect(result.credential.utcDay).toBe('2026-09-17');
    expect(result.token).not.toBe(oldToken);
  });
});
