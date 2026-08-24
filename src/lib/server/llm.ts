import { env } from '@/lib/server/env';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

const llmProvider = createOpenAICompatible({
  name: 'openai-compatible',
  baseURL: env.LLM_BASE_URL,
  apiKey: env.LLM_API_KEY,
  supportsStructuredOutputs: true,
  transformRequestBody: (args) => ({
    ...args,
    thinking: { type: 'disabled' },
  }),
});

/** 平台对话模型（OpenAI 兼容 Chat Completions，如 DeepSeek）。 */
export function getChatModel() {
  return llmProvider.chatModel(env.LLM_MODEL);
}
