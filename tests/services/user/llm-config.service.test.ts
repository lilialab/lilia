import { AppError } from '@/lib/server/app-error';
import { decryptSecret, encryptSecret } from '@/lib/server/secret-crypto';
import { API_ERROR_CODE } from '@/types/api-error';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/server/env', () => ({
  env: {
    AUTH_SESSION_SECRET: 'test-session-secret',
  },
}));

vi.mock('@/lib/server/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/server/prisma';
import {
  getEnabledUserLlmEndpoint,
  getUserLlmConfig,
  upsertUserLlmConfig,
} from '@/services/user/llm-config.service';

const emptyRow = {
  llmBaseUrl: null,
  llmModel: null,
  llmApiKeyCipher: null,
};

describe('getUserLlmConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('不回显 Key 明文', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      llmBaseUrl: 'https://api.example.com/v1',
      llmModel: 'gpt-4o-mini',
      llmApiKeyCipher: 'iv.tag.cipher',
    } as never);

    const config = await getUserLlmConfig('user-1');

    expect(config).toEqual({
      baseUrl: 'https://api.example.com/v1',
      model: 'gpt-4o-mini',
      hasApiKey: true,
    });
    expect(JSON.stringify(config)).not.toContain('iv.tag.cipher');
  });
});

describe('upsertUserLlmConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('三项齐全时加密保存 Key 且公开视图无明文', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(emptyRow as never);
    vi.mocked(prisma.user.update).mockImplementation((args) => {
      const { data } = args as { data: typeof emptyRow };
      return Promise.resolve(data) as never;
    });

    const config = await upsertUserLlmConfig('user-1', {
      baseUrl: ' https://api.example.com/v1 ',
      model: ' gpt-4o-mini ',
      apiKey: 'sk-secret',
    });

    expect(prisma.user.update).toHaveBeenCalledOnce();
    const data = vi.mocked(prisma.user.update).mock.calls[0]?.[0]?.data as {
      llmBaseUrl: string;
      llmModel: string;
      llmApiKeyCipher: string;
    };
    expect(data.llmBaseUrl).toBe('https://api.example.com/v1');
    expect(data.llmModel).toBe('gpt-4o-mini');
    expect(data.llmApiKeyCipher).not.toBe('sk-secret');
    expect(decryptSecret(data.llmApiKeyCipher)).toBe('sk-secret');
    expect(config.hasApiKey).toBe(true);
    expect(JSON.stringify(config)).not.toContain('sk-secret');
  });

  it('已有 Key 时留空不覆盖', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      llmBaseUrl: 'https://old.example.com/v1',
      llmModel: 'old-model',
      llmApiKeyCipher: 'existing-cipher',
    } as never);
    vi.mocked(prisma.user.update).mockImplementation((args) => {
      const { data } = args as { data: typeof emptyRow };
      return Promise.resolve(data) as never;
    });

    await upsertUserLlmConfig('user-1', {
      baseUrl: 'https://api.example.com/v1',
      model: 'gpt-4o-mini',
      apiKey: '',
    });

    const data = vi.mocked(prisma.user.update).mock.calls[0]?.[0]?.data as {
      llmApiKeyCipher: string;
    };
    expect(data.llmApiKeyCipher).toBe('existing-cipher');
  });

  it('三项全空则清空配置', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      llmBaseUrl: 'https://api.example.com/v1',
      llmModel: 'gpt-4o-mini',
      llmApiKeyCipher: 'existing-cipher',
    } as never);
    vi.mocked(prisma.user.update).mockResolvedValue(emptyRow as never);

    const config = await upsertUserLlmConfig('user-1', {
      baseUrl: '  ',
      model: '',
      apiKey: '',
    });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: emptyRow,
      select: expect.objectContaining({ llmApiKeyCipher: true }),
    });
    expect(config.hasApiKey).toBe(false);
  });

  it('未配齐时拒绝保存', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(emptyRow as never);

    await expect(
      upsertUserLlmConfig('user-1', {
        baseUrl: 'https://api.example.com/v1',
        model: 'gpt-4o-mini',
        apiKey: '',
      }),
    ).rejects.toMatchObject({
      status: 400,
      code: API_ERROR_CODE.LLM_CONFIG_INCOMPLETE,
    });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('非法 Base URL 拒绝保存', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(emptyRow as never);

    await expect(
      upsertUserLlmConfig('user-1', {
        baseUrl: 'not-a-url',
        model: 'gpt-4o-mini',
        apiKey: 'sk-secret',
      }),
    ).rejects.toMatchObject({
      status: 400,
      code: API_ERROR_CODE.LLM_BASE_URL_INVALID,
    });
    await expect(
      upsertUserLlmConfig('user-1', {
        baseUrl: 'ftp://example.com',
        model: 'gpt-4o-mini',
        apiKey: 'sk-secret',
      }),
    ).rejects.toMatchObject({
      status: 400,
      code: API_ERROR_CODE.LLM_BASE_URL_INVALID,
    });
  });

  it('用户不存在时 401', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    await expect(getUserLlmConfig('missing')).rejects.toBeInstanceOf(AppError);
  });
});

describe('getEnabledUserLlmEndpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('三项齐全时解密返回端点', async () => {
    const llmApiKeyCipher = encryptSecret('sk-user');
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      llmBaseUrl: 'https://api.example.com/v1',
      llmModel: 'gpt-4o-mini',
      llmApiKeyCipher,
    } as never);

    const endpoint = await getEnabledUserLlmEndpoint('user-1');

    expect(endpoint).toEqual({
      baseUrl: 'https://api.example.com/v1',
      apiKey: 'sk-user',
      model: 'gpt-4o-mini',
    });
  });

  it('未配齐返回 null', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      llmBaseUrl: 'https://api.example.com/v1',
      llmModel: 'gpt-4o-mini',
      llmApiKeyCipher: null,
    } as never);

    await expect(getEnabledUserLlmEndpoint('user-1')).resolves.toBeNull();
  });

  it('密文损坏时抛错且不回退', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      llmBaseUrl: 'https://api.example.com/v1',
      llmModel: 'gpt-4o-mini',
      llmApiKeyCipher: 'not-valid-cipher',
    } as never);

    await expect(getEnabledUserLlmEndpoint('user-1')).rejects.toMatchObject({
      status: 500,
    });
  });
});
