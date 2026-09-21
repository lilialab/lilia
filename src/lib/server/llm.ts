import { env } from '@/lib/server/env';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

function createCompatibleProvider(baseURL: string, apiKey: string) {
  return createOpenAICompatible({
    name: 'openai-compatible',
    baseURL,
    apiKey,
    supportsStructuredOutputs: true,
  });
}

const platformProvider = createCompatibleProvider(env.LLM_BASE_URL, env.LLM_API_KEY);

/** 平台对话模型（OpenAI 兼容 Chat Completions）。记忆 Job 始终用这个。 */
export function getChatModel() {
  return platformProvider.chatModel(env.LLM_MODEL);
}

/** 用户自备 OpenAI 兼容端点上的对话模型；调用方保证三项齐全。 */
export function getChatModelForUserEndpoint(input: {
  baseUrl: string;
  apiKey: string;
  model: string;
}) {
  return createCompatibleProvider(input.baseUrl, input.apiKey).chatModel(input.model);
}
