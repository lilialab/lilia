// src/lib/ollama-provider.ts
import { env } from '@/lib/server/env';
import { createOllama } from 'ollama-ai-provider-v2';

/** 仅用于 embedding；对话与记忆 Job 走 `@/lib/server/llm`。 */
export const ollamaProvider = createOllama({
  baseURL: env.OLLAMA_BASE_URL,
});
