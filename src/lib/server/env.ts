import fs from 'node:fs';
import path from 'node:path';

/* -------------------------------------------------------------------------- */
/* Bootstrap                                                                  */
/* -------------------------------------------------------------------------- */

const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* Exported env                                                               */
/* -------------------------------------------------------------------------- */

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
  DATABASE_URL:
    `mysql://${DATABASE_USER}:${DATABASE_PASSWORD}@${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}`,

  CHROMA_HOST: requireStringEnv('CHROMA_HOST'),
  CHROMA_PORT: requireNumberEnv('CHROMA_PORT'),

  S3_ENDPOINT: requireStringEnv('S3_ENDPOINT'),
  S3_REGION: requireStringEnv('S3_REGION'),
  S3_ACCESS_KEY: requireStringEnv('S3_ACCESS_KEY'),
  S3_SECRET_KEY: requireStringEnv('S3_SECRET_KEY'),
  S3_BUCKET: requireStringEnv('S3_BUCKET'),

  REDIS_URL: requireStringEnv('REDIS_URL'),

  LOG_LEVEL: requireStringEnv('LOG_LEVEL'),
  LOKI_URL: requireStringEnv('LOKI_URL'),
  LOG_TO_LOKI: requireBooleanEnv('LOG_TO_LOKI'),

  EMBED_BASE_URL: requireStringEnv('EMBED_BASE_URL'),
  EMBED_API_KEY: requireStringEnv('EMBED_API_KEY'),
  EMBED_MODEL: requireStringEnv('EMBED_MODEL'),

  LLM_BASE_URL: requireStringEnv('LLM_BASE_URL'),
  LLM_API_KEY: requireStringEnv('LLM_API_KEY'),
  LLM_MODEL: requireStringEnv('LLM_MODEL'),

  // 记忆 / 聊天调参：说明见 .env.example
  MEMORY_HALF_LIFE_EVENT_DAYS: requirePositiveNumberEnv('MEMORY_HALF_LIFE_EVENT_DAYS'),
  MEMORY_HALF_LIFE_FACT_DAYS: requirePositiveNumberEnv('MEMORY_HALF_LIFE_FACT_DAYS'),
  MEMORY_MAINTAIN_NEIGHBOR_MIN_DECAY: requireUnitIntervalEnv(
    'MEMORY_MAINTAIN_NEIGHBOR_MIN_DECAY',
  ),
  MEMORY_RAG_LIMIT: requirePositiveIntEnv('MEMORY_RAG_LIMIT'),
  MEMORY_RAG_CANDIDATE_MULTIPLIER: requirePositiveIntEnv('MEMORY_RAG_CANDIDATE_MULTIPLIER'),
  MEMORY_MAINTAIN_NEIGHBOR_LIMIT: requirePositiveIntEnv('MEMORY_MAINTAIN_NEIGHBOR_LIMIT'),
  MEMORY_PROFILE_REFERENCE_LIMIT: requirePositiveIntEnv('MEMORY_PROFILE_REFERENCE_LIMIT'),
  MEMORY_EXTRACT_IDLE_MINUTES: requirePositiveNumberEnv('MEMORY_EXTRACT_IDLE_MINUTES'),
  MEMORY_MAINTAIN_IDLE_HOURS: requirePositiveNumberEnv('MEMORY_MAINTAIN_IDLE_HOURS'),
  MEMORY_MAINTAIN_MIN_INTERVAL_HOURS: requirePositiveNumberEnv(
    'MEMORY_MAINTAIN_MIN_INTERVAL_HOURS',
  ),
  CHAT_CONTEXT_MESSAGE_LIMIT: requirePositiveIntEnv('CHAT_CONTEXT_MESSAGE_LIMIT'),
  CHAT_DAILY_TURN_LIMIT: requirePositiveIntEnv('CHAT_DAILY_TURN_LIMIT'),
  CHARACTER_CREATE_DAILY_LIMIT: requirePositiveIntEnv('CHARACTER_CREATE_DAILY_LIMIT'),
  GUEST_TRIAL_DAILY_TURN_LIMIT: requirePositiveIntEnv('GUEST_TRIAL_DAILY_TURN_LIMIT'),
  LLM_STRUCTURED_MAX_RETRIES: requireNonNegativeIntEnv('LLM_STRUCTURED_MAX_RETRIES'),
  MEMORY_JOB_MAX_HISTORY: requirePositiveIntEnv('MEMORY_JOB_MAX_HISTORY'),
  MEMORY_DEFAULT_CONFIDENCE: requireUnitIntervalEnv('MEMORY_DEFAULT_CONFIDENCE'),

  AUTH_SESSION_SECRET: requireStringEnv('AUTH_SESSION_SECRET'),
  AUTH_SESSION_TTL_DAYS: requirePositiveNumberEnv('AUTH_SESSION_TTL_DAYS'),
  AUTH_SESSION_COOKIE_NAME: requireStringEnv('AUTH_SESSION_COOKIE_NAME'),
  GUEST_TRIAL_COOKIE_NAME: requireStringEnv('GUEST_TRIAL_COOKIE_NAME'),
  AUTH_RATE_LIMIT_REGISTER_PER_IP_HOUR: requirePositiveIntEnv(
    'AUTH_RATE_LIMIT_REGISTER_PER_IP_HOUR',
  ),
  AUTH_RATE_LIMIT_REGISTER_PER_IP_DAY: requirePositiveIntEnv('AUTH_RATE_LIMIT_REGISTER_PER_IP_DAY'),
  AUTH_RATE_LIMIT_LOGIN_PER_IP_MINUTE: requirePositiveIntEnv('AUTH_RATE_LIMIT_LOGIN_PER_IP_MINUTE'),
  AUTH_RATE_LIMIT_LOGIN_PER_USERNAME_15MIN: requirePositiveIntEnv(
    'AUTH_RATE_LIMIT_LOGIN_PER_USERNAME_15MIN',
  ),
  TURNSTILE_SITE_KEY: requireStringEnv('TURNSTILE_SITE_KEY'),
  TURNSTILE_SECRET_KEY: requireStringEnv('TURNSTILE_SECRET_KEY'),

  OFFICIAL_USERNAME: requireStringEnv('OFFICIAL_USERNAME'),
  OFFICIAL_PASSWORD: requireStringEnv('OFFICIAL_PASSWORD'),
} as const;
