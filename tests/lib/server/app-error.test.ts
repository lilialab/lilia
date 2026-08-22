import { AppError } from '@/lib/server/app-error';
import { API_ERROR_CODE } from '@/types/api-error';
import { describe, expect, it } from 'vitest';

describe('AppError', () => {
  it('静态方法可同时带中文 message 和稳定 code', () => {
    const error = AppError.unauthorized('账号或密码错误', API_ERROR_CODE.INVALID_CREDENTIALS);
    expect(error.status).toBe(401);
    expect(error.message).toBe('账号或密码错误');
    expect(error.code).toBe(API_ERROR_CODE.INVALID_CREDENTIALS);
  });

  it('未传 code 时按 status 给默认码', () => {
    expect(AppError.badRequest('参数无效').code).toBe(API_ERROR_CODE.INVALID_REQUEST);
    expect(AppError.unauthorized('未登录').code).toBe(API_ERROR_CODE.UNAUTHORIZED);
    expect(AppError.notFound('会话不存在').code).toBe(API_ERROR_CODE.NOT_FOUND);
    expect(AppError.conflict('生成中').code).toBe(API_ERROR_CODE.CONFLICT);
    expect(AppError.tooManyRequests('太频繁').code).toBe(API_ERROR_CODE.RATE_LIMITED);
    expect(AppError.internal('boom').code).toBe(API_ERROR_CODE.INTERNAL_ERROR);
  });
});
