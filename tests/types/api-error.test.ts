import { en } from '@/i18n/messages/en';
import { zh } from '@/i18n/messages/zh';
import { API_ERROR_CODE, isApiErrorCode } from '@/types/api-error';
import { describe, expect, it } from 'vitest';

describe('isApiErrorCode', () => {
  it('接受目录内的 code', () => {
    expect(isApiErrorCode(API_ERROR_CODE.INVALID_CREDENTIALS)).toBe(true);
    expect(isApiErrorCode('USERNAME_TAKEN')).toBe(true);
  });

  it('拒绝其它值', () => {
    expect(isApiErrorCode('会话不存在')).toBe(false);
    expect(isApiErrorCode('')).toBe(false);
    expect(isApiErrorCode(undefined)).toBe(false);
  });
});

describe('errors 文案目录', () => {
  it('en / zh 覆盖全部 API_ERROR_CODE', () => {
    for (const code of Object.values(API_ERROR_CODE)) {
      expect(en.errors[code].length).toBeGreaterThan(0);
      expect(zh.errors[code].length).toBeGreaterThan(0);
    }
  });
});
