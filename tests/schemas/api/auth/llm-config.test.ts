import { putLlmConfigBodySchema } from '@/schemas/api/auth/llm-config';
import { API_ERROR_CODE } from '@/types/api-error';
import { describe, expect, it } from 'vitest';

describe('putLlmConfigBodySchema', () => {
  it('合法 body 通过校验', () => {
    const result = putLlmConfigBodySchema.safeParse({
      baseUrl: 'https://api.example.com/v1',
      model: 'gpt-4o-mini',
      apiKey: 'sk-secret',
    });
    expect(result.success).toBe(true);
  });

  it('过长 Base URL 失败', () => {
    const result = putLlmConfigBodySchema.safeParse({
      baseUrl: 'https://example.com/' + 'a'.repeat(512),
      model: 'gpt-4o-mini',
      apiKey: 'sk-secret',
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.message).toBe(API_ERROR_CODE.INVALID_REQUEST);
  });
});
