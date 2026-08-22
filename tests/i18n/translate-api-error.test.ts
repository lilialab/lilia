import { translateApiError } from '@/i18n/client';
import { en } from '@/i18n/messages/en';
import { zh } from '@/i18n/messages/zh';
import { ApiClientError } from '@/lib/client/api-client';
import { API_ERROR_CODE } from '@/types/api-error';
import { describe, expect, it } from 'vitest';

describe('translateApiError', () => {
  const tEn = (key: keyof typeof en.errors) => en.errors[key];
  const tZh = (key: keyof typeof zh.errors) => zh.errors[key];

  it('按传入的 t 翻成对应语言', () => {
    const error = new ApiClientError(
      API_ERROR_CODE.INVALID_CREDENTIALS,
      API_ERROR_CODE.INVALID_CREDENTIALS,
    );
    expect(translateApiError(error, tEn)).toBe('Incorrect username or password');
    expect(translateApiError(error, tZh)).toBe('账号或密码错误');
  });

  it('RATE_LIMITED 有对应文案', () => {
    const error = new ApiClientError('操作太频繁，请稍后再试', API_ERROR_CODE.RATE_LIMITED);
    expect(translateApiError(error, tEn)).toBe('Too many attempts. Please try again later');
    expect(translateApiError(error, tZh)).toBe('操作太频繁，请稍后再试');
  });

  it('省略 t 时按默认语言翻', () => {
    const error = new ApiClientError(
      '对方正在回复，请稍后再发',
      API_ERROR_CODE.GENERATION_BUSY,
    );
    expect(translateApiError(error)).toBe(en.errors.GENERATION_BUSY);
  });

  it('未知 code 回退到 error.message', () => {
    expect(translateApiError(new Error('会话不存在'))).toBe('会话不存在');
  });

  it('无 message 时用 fallback', () => {
    expect(translateApiError({})).toBe(en.errors.fallback);
  });
});
