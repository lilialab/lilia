import { AppError } from '@/lib/server/app-error';
import { prisma } from '@/lib/server/prisma';
import { decryptSecret, encryptSecret } from '@/lib/server/secret-crypto';
import { API_ERROR_CODE } from '@/types/api-error';

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface UserLlmConfigView {
  baseUrl: string | null;
  model: string | null;
  hasApiKey: boolean;
}

export interface UserLlmEndpoint {
  baseUrl: string;
  apiKey: string;
  model: string;
}

type LlmConfigRow = {
  llmBaseUrl: string | null;
  llmModel: string | null;
  llmApiKeyCipher: string | null;
};

const llmConfigSelect = {
  llmBaseUrl: true,
  llmModel: true,
  llmApiKeyCipher: true,
} as const;

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function toView(row: LlmConfigRow): UserLlmConfigView {
  return {
    baseUrl: row.llmBaseUrl,
    model: row.llmModel,
    hasApiKey: Boolean(row.llmApiKeyCipher),
  };
}

async function requireLlmConfigRow(userId: string): Promise<LlmConfigRow> {
  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: llmConfigSelect,
  });
  if (!row) {
    throw AppError.unauthorized('用户不存在');
  }
  return row;
}

async function writeLlmConfig(userId: string, data: LlmConfigRow): Promise<UserLlmConfigView> {
  const row = await prisma.user.update({
    where: { id: userId },
    data,
    select: llmConfigSelect,
  });
  return toView(row);
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                 */
/* -------------------------------------------------------------------------- */

/** 读取用户 LLM 配置公开视图（不含 Key 明文）。 */
export async function getUserLlmConfig(userId: string): Promise<UserLlmConfigView> {
  const row = await requireLlmConfigRow(userId);
  return toView(row);
}

/** 三项齐全则解密返回聊天端点；未配齐返回 null。解密失败抛错，不回退平台。 */
export async function getEnabledUserLlmEndpoint(userId: string): Promise<UserLlmEndpoint | null> {
  const row = await requireLlmConfigRow(userId);
  const baseUrl = row.llmBaseUrl?.trim();
  const model = row.llmModel?.trim();
  if (!baseUrl || !model || !row.llmApiKeyCipher) {
    return null;
  }

  let apiKey: string;
  try {
    apiKey = decryptSecret(row.llmApiKeyCipher).trim();
  } catch {
    throw AppError.internal('用户 LLM 配置无法解密');
  }

  if (!apiKey) {
    return null;
  }

  return { baseUrl, apiKey, model };
}

/** 保存或清空用户 LLM 配置；三项全空则清空，否则须齐全（已有 Key 时可留空不改）。 */
export async function upsertUserLlmConfig(
  userId: string,
  input: { baseUrl: string; model: string; apiKey: string },
): Promise<UserLlmConfigView> {
  const baseUrl = input.baseUrl.trim();
  const model = input.model.trim();
  const apiKey = input.apiKey.trim();
  const existing = await requireLlmConfigRow(userId);

  if (!baseUrl && !model && !apiKey) {
    return writeLlmConfig(userId, {
      llmBaseUrl: null,
      llmModel: null,
      llmApiKeyCipher: null,
    });
  }

  if (!baseUrl || !model || (!apiKey && !existing.llmApiKeyCipher)) {
    throw AppError.badRequest(
      '请同时填写 Base URL、API Key 与模型',
      API_ERROR_CODE.LLM_CONFIG_INCOMPLETE,
    );
  }

  if (!isHttpUrl(baseUrl)) {
    throw AppError.badRequest('Base URL 须为 http(s) 地址', API_ERROR_CODE.LLM_BASE_URL_INVALID);
  }

  const llmApiKeyCipher = apiKey ? encryptSecret(apiKey) : existing.llmApiKeyCipher;

  return writeLlmConfig(userId, {
    llmBaseUrl: baseUrl,
    llmModel: model,
    llmApiKeyCipher,
  });
}
