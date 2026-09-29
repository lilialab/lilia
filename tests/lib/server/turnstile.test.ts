import type { AppError } from '@/lib/server/app-error';
import { verifyTurnstileToken } from '@/lib/server/turnstile';
import { TURNSTILE_ACTION } from '@/lib/turnstile';
import { API_ERROR_CODE } from '@/types/api-error';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('verifyTurnstileToken', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('校验通过时不抛错', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    await expect(verifyTurnstileToken('test-token')).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledWith(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }),
    );
    const body = fetchMock.mock.calls[0]?.[1]?.body as URLSearchParams;
    expect(body.get('response')).toBe('test-token');
    expect(body.get('secret')).toBeTruthy();
    expect(body.get('remoteip')).toBeNull();
  });

  it('action 与预期一致时通过', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, action: TURNSTILE_ACTION.LOGIN }),
    });

    await expect(
      verifyTurnstileToken('test-token', { expectedAction: TURNSTILE_ACTION.LOGIN }),
    ).resolves.toBeUndefined();
  });

  it('action 与预期不一致时仍通过（只告警，不作为拒绝依据）', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, action: 'test' }),
    });

    await expect(
      verifyTurnstileToken('test-token', { expectedAction: TURNSTILE_ACTION.LOGIN }),
    ).resolves.toBeUndefined();
  });

  it('不回 action 字段时也通过', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    await expect(
      verifyTurnstileToken('test-token', { expectedAction: TURNSTILE_ACTION.LOGIN }),
    ).resolves.toBeUndefined();
  });

  it('Cloudflare 返回 success=false 时抛 400', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ success: false, 'error-codes': ['invalid-input-response'] }),
    });

    await expect(verifyTurnstileToken('bad-token')).rejects.toMatchObject(
      {
        status: 400,
        code: API_ERROR_CODE.TURNSTILE_VERIFICATION_FAILED,
        message: '人机验证失败，请重试',
      } satisfies Partial<AppError>,
    );
  });

  it('siteverify HTTP 非 2xx 时抛 500', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });

    await expect(verifyTurnstileToken('test-token')).rejects.toMatchObject(
      {
        status: 500,
        code: API_ERROR_CODE.INTERNAL_ERROR,
      } satisfies Partial<AppError>,
    );
  });

  it('网络失败时抛 500', async () => {
    fetchMock.mockRejectedValue(new Error('network'));

    await expect(verifyTurnstileToken('test-token')).rejects.toMatchObject(
      {
        status: 500,
        code: API_ERROR_CODE.INTERNAL_ERROR,
      } satisfies Partial<AppError>,
    );
  });
});
