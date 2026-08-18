import { parseApiResponse } from '@/lib/client/api-client';
import { API_ERROR_CODE } from '@/types/api-error';
import { describe, expect, it } from 'vitest';

describe('parseApiResponse', () => {
  it('失败响应抛出 ApiClientError，带 code', async () => {
    const res = new Response(
      JSON.stringify({
        success: false,
        error: API_ERROR_CODE.INVALID_CREDENTIALS,
        code: API_ERROR_CODE.INVALID_CREDENTIALS,
      }),
      { status: 401 },
    );

    await expect(parseApiResponse(res)).rejects.toMatchObject({
      name: 'ApiClientError',
      message: API_ERROR_CODE.INVALID_CREDENTIALS,
      code: API_ERROR_CODE.INVALID_CREDENTIALS,
    });
  });
});
