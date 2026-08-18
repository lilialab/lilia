import { AppError } from '@/lib/server/app-error';
import { parseInput } from '@/lib/server/parse-schema';
import { loginBodySchema } from '@/schemas/api/auth/login';
import { API_ERROR_CODE } from '@/types/api-error';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

describe('parseInput', () => {
  it('已知 code 的 issue：error 与 code 都是该 code', () => {
    try {
      parseInput(loginBodySchema, { username: 'tom', password: 'short' });
      expect.unreachable();
    } catch (error) {
      expect(error).toMatchObject({
        status: 400,
        message: API_ERROR_CODE.PASSWORD_TOO_SHORT,
        code: API_ERROR_CODE.PASSWORD_TOO_SHORT,
      });
    }
  });

  it('非 code 的 issue 仍带 path 前缀，code 为 INVALID_REQUEST', () => {
    const schema = z.object({ title: z.string().min(1) });
    try {
      parseInput(schema, { title: '' });
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).message).toMatch(/^title: /);
      expect((error as AppError).code).toBe(API_ERROR_CODE.INVALID_REQUEST);
    }
  });
});
