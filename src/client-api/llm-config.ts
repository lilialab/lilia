import { apiFetchJson } from '@/lib/client/api-fetch';
import type { PutLlmConfigBody } from '@/schemas/api/auth/llm-config';

export interface UserLlmConfig {
  baseUrl: string | null;
  model: string | null;
  hasApiKey: boolean;
}

/** 读取当前用户 LLM 配置；Key 只返回是否已配置。 */
export async function fetchUserLlmConfig(): Promise<UserLlmConfig> {
  const data = await apiFetchJson<{ config: UserLlmConfig }>('/api/auth/llm-config');
  return data.config;
}

/** 保存或清空当前用户 LLM 配置。三项全空则清空；已有 Key 时 apiKey 可留空不改。 */
export async function updateUserLlmConfig(input: PutLlmConfigBody): Promise<UserLlmConfig> {
  const data = await apiFetchJson<{ config: UserLlmConfig }>('/api/auth/llm-config', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return data.config;
}
