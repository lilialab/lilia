import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/server/env', () => ({
  env: {
    LLM_MODEL: 'platform-model',
  },
}));

vi.mock('@/lib/server/llm', () => ({
  getChatModel: vi.fn(() => 'platform-chat-model'),
  getChatModelForUserEndpoint: vi.fn(() => 'user-chat-model'),
}));

vi.mock('@/services/user/llm-config.service', () => ({
  getEnabledUserLlmEndpoint: vi.fn(),
}));

import { getChatModel, getChatModelForUserEndpoint } from '@/lib/server/llm';
import { resolveChatLlm } from '@/services/chat/resolve-chat-llm';
import { getEnabledUserLlmEndpoint } from '@/services/user/llm-config.service';

describe('resolveChatLlm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('未配置时走平台模型', async () => {
    vi.mocked(getEnabledUserLlmEndpoint).mockResolvedValue(null);

    const resolved = await resolveChatLlm('user-1');

    expect(resolved).toEqual({
      model: 'platform-chat-model',
      modelId: 'platform-model',
      usesUserEndpoint: false,
    });
    expect(getChatModel).toHaveBeenCalledOnce();
    expect(getChatModelForUserEndpoint).not.toHaveBeenCalled();
  });

  it('配齐时走用户端点', async () => {
    const endpoint = {
      baseUrl: 'https://api.example.com/v1',
      apiKey: 'sk-user',
      model: 'gpt-4o-mini',
    };
    vi.mocked(getEnabledUserLlmEndpoint).mockResolvedValue(endpoint);

    const resolved = await resolveChatLlm('user-1');

    expect(resolved.usesUserEndpoint).toBe(true);
    expect(resolved.modelId).toBe('gpt-4o-mini');
    expect(resolved.model).toBe('user-chat-model');
    expect(getChatModelForUserEndpoint).toHaveBeenCalledWith(endpoint);
    expect(getChatModel).not.toHaveBeenCalled();
  });
});
