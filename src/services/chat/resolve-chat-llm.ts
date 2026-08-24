import { env } from '@/lib/server/env';
import { getChatModel, getChatModelForUserEndpoint } from '@/lib/server/llm';
import { getEnabledUserLlmEndpoint } from '@/services/user/llm-config.service';

export interface ResolvedChatLlm {
  model: ReturnType<typeof getChatModel>;
  modelId: string;
  usesUserEndpoint: boolean;
}

/** 单聊/群聊用：配齐则走用户端点，否则平台模型。记忆 Job 不要调用。 */
export async function resolveChatLlm(userId: string): Promise<ResolvedChatLlm> {
  const endpoint = await getEnabledUserLlmEndpoint(userId);
  if (!endpoint) {
    return {
      model: getChatModel(),
      modelId: env.LLM_MODEL,
      usesUserEndpoint: false,
    };
  }

  return {
    model: getChatModelForUserEndpoint(endpoint),
    modelId: endpoint.model,
    usesUserEndpoint: true,
  };
}
