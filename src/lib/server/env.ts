import fs from 'node:fs';
import path from 'node:path';

const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

function readEnv(key: string): string | undefined {
  const value = process.env[key]?.trim();
  return value || undefined;
}

function envError(key: string, detail: string): never {
  throw new Error(`❌ [Env Error]: 环境变量 ${key} ${detail}`);
}

function requireStringEnv(key: string): string {
  const value = readEnv(key);
  if (value === undefined) {
    envError(key, '未设置或为空。请检查 .env 或系统环境变量。');
  }
  return value;
}

function requireNumberEnv(key: string): number {
  const raw = requireStringEnv(key);
  const n = Number(raw);
  if (!Number.isFinite(n)) {
    envError(key, `必须是有效数字，当前值为 "${raw}"。`);
  }
  return n;
}

/** 正数（> 0），用于半衰期天数等。 */
function requirePositiveNumberEnv(key: string): number {
  const n = requireNumberEnv(key);
  if (n <= 0) {
    envError(key, `必须大于 0，当前值为 "${n}"。`);
  }
  return n;
}

/** 开区间 (0, 1] 内的衰减权重阈值。 */
function requireUnitIntervalEnv(key: string): number {
  const n = requireNumberEnv(key);
  if (n <= 0 || n > 1) {
    envError(key, `必须在 (0, 1] 内，当前值为 "${n}"。`);
  }
  return n;
}

/** 正整数（>= 1），用于条数、倍数等配置。 */
function requirePositiveIntEnv(key: string): number {
  const n = requireNumberEnv(key);
  if (!Number.isInteger(n) || n < 1) {
    envError(key, `必须为 >= 1 的整数，当前值为 "${n}"。`);
  }
  return n;
}

/** 非负整数（>= 0），用于 LLM 重试次数等。 */
function requireNonNegativeIntEnv(key: string): number {
  const n = requireNumberEnv(key);
  if (!Number.isInteger(n) || n < 0) {
    envError(key, `必须为 >= 0 的整数，当前值为 "${n}"。`);
  }
  return n;
}

function requireBooleanEnv(key: string): boolean {
  const raw = requireStringEnv(key);
  if (raw !== 'true' && raw !== 'false') {
    envError(key, `必须是 "true" 或 "false"，当前值为 "${raw}"。`);
  }
  return raw === 'true';
}

function buildOllamaBaseURL(): string {
  const host = process.env.OLLAMA_HOST?.trim();
  if (!host) return 'http://127.0.0.1:11434/api';
  return host.endsWith('/api') ? host : `http://${host}/api`;
}

const DATABASE_HOST = requireStringEnv('DATABASE_HOST');
const DATABASE_PORT = requireNumberEnv('DATABASE_PORT');
const DATABASE_USER = requireStringEnv('DATABASE_USER');
const DATABASE_PASSWORD = requireStringEnv('DATABASE_PASSWORD');
const DATABASE_NAME = requireStringEnv('DATABASE_NAME');

export const env = {
  NODE_ENV: requireStringEnv('NODE_ENV'),
  DATABASE_HOST,
  DATABASE_PORT,
  DATABASE_USER,
  DATABASE_PASSWORD,
  DATABASE_NAME,
  DATABASE_URL: `mysql://${DATABASE_USER}:${DATABASE_PASSWORD}@${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}`,

  CHROMA_HOST: requireStringEnv('CHROMA_HOST'),
  CHROMA_PORT: requireNumberEnv('CHROMA_PORT'),

  MINIO_ACCESS_KEY: requireStringEnv('MINIO_ACCESS_KEY'),
  MINIO_SECRET_KEY: requireStringEnv('MINIO_SECRET_KEY'),
  MINIO_ENDPOINT: requireStringEnv('MINIO_ENDPOINT'),
  MINIO_BUCKET_NAME: requireStringEnv('MINIO_BUCKET_NAME'),

  LOG_LEVEL: requireStringEnv('LOG_LEVEL'),
  LOKI_URL: requireStringEnv('LOKI_URL'),
  LOG_TO_LOKI: requireBooleanEnv('LOG_TO_LOKI'),

  OLLAMA_MODEL: requireStringEnv('OLLAMA_MODEL'),
  OLLAMA_EMBED_MODEL: requireStringEnv('OLLAMA_EMBED_MODEL'),
  OLLAMA_BASE_URL: buildOllamaBaseURL(),

  // 记忆 / 聊天调参：说明见 .env.example
  MEMORY_HALF_LIFE_EVENT_DAYS: requirePositiveNumberEnv('MEMORY_HALF_LIFE_EVENT_DAYS'),
  MEMORY_HALF_LIFE_PREFERENCE_DAYS: requirePositiveNumberEnv('MEMORY_HALF_LIFE_PREFERENCE_DAYS'),
  MEMORY_HALF_LIFE_FACT_DAYS: requirePositiveNumberEnv('MEMORY_HALF_LIFE_FACT_DAYS'),
  MEMORY_MAINTENANCE_NEIGHBOR_MIN_DECAY: requireUnitIntervalEnv(
    'MEMORY_MAINTENANCE_NEIGHBOR_MIN_DECAY',
  ),
  MEMORY_RAG_LIMIT: requirePositiveIntEnv('MEMORY_RAG_LIMIT'),
  MEMORY_RAG_CANDIDATE_MULTIPLIER: requirePositiveIntEnv('MEMORY_RAG_CANDIDATE_MULTIPLIER'),
  MEMORY_MAINTENANCE_NEIGHBOR_LIMIT: requirePositiveIntEnv('MEMORY_MAINTENANCE_NEIGHBOR_LIMIT'),
  MEMORY_PROFILE_REFERENCE_LIMIT: requirePositiveIntEnv('MEMORY_PROFILE_REFERENCE_LIMIT'),
  CHAT_CONTEXT_MESSAGE_LIMIT: requirePositiveIntEnv('CHAT_CONTEXT_MESSAGE_LIMIT'),
  LLM_STRUCTURED_MAX_RETRIES: requireNonNegativeIntEnv('LLM_STRUCTURED_MAX_RETRIES'),
  CONSOLIDATION_JOB_MAX_HISTORY: requirePositiveIntEnv('CONSOLIDATION_JOB_MAX_HISTORY'),
  MEMORY_DEFAULT_CONFIDENCE: requireUnitIntervalEnv('MEMORY_DEFAULT_CONFIDENCE'),
  KNOWLEDGE_RAG_LIMIT: requirePositiveIntEnv('KNOWLEDGE_RAG_LIMIT'),
} as const;
