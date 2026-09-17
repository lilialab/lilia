import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/server/env', () => ({
  env: {
    AUTH_SESSION_SECRET: 'test-guest-trial-secret',
    GUEST_TRIAL_COOKIE_NAME: 'lilia_guest_trial',
  },
}));

import {
  assertGuestTrialCredential,
  createGuestTrialToken,
  newGuestTrialId,
  parseGuestTrialToken,
} from '@/services/guest/trial-cookie';
import { API_ERROR_CODE } from '@/types/api-error';

describe('guest-trial token', () => {
  it('签发后可解析', () => {
    const guestId = newGuestTrialId();
    const token = createGuestTrialToken(guestId, '2026-09-17');
    expect(parseGuestTrialToken(token)).toEqual({ guestId, utcDay: '2026-09-17' });
  });

  it('篡改签名则解析失败', () => {
    const guestId = newGuestTrialId();
    const token = createGuestTrialToken(guestId, '2026-09-17');
    const tampered = `${token.slice(0, -4)}abcd`;
    expect(parseGuestTrialToken(tampered)).toBeNull();
  });

  it('今日凭证 assert 通过', () => {
    const guestId = newGuestTrialId();
    const now = new Date('2026-09-17T12:00:00.000Z');
    const token = createGuestTrialToken(guestId, '2026-09-17');
    expect(assertGuestTrialCredential(token, now)).toEqual({
      guestId,
      utcDay: '2026-09-17',
    });
  });

  it('跨日凭证 assert 失败', () => {
    const guestId = newGuestTrialId();
    const token = createGuestTrialToken(guestId, '2026-09-16');
    expect(() => assertGuestTrialCredential(token, new Date('2026-09-17T00:00:00.000Z'))).toThrow(
      expect.objectContaining({
        status: 403,
        code: API_ERROR_CODE.GUEST_TRIAL_REQUIRED,
      }),
    );
  });

  it('缺失 token assert 失败', () => {
    expect(() => assertGuestTrialCredential(null)).toThrow(
      expect.objectContaining({
        status: 403,
        code: API_ERROR_CODE.GUEST_TRIAL_REQUIRED,
      }),
    );
  });
});
