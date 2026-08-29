import { type JsonObject } from '@/utils/json-yaml';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

export const DEFAULT_CHARACTER_ID = 'lilia';

export type JobPromptId = 'maintain' | 'user-profile';

export type CharacterJobPromptId = 'extract' | 'user-profile';

const PROMPTS_ROOT = path.join(process.cwd(), 'src/prompts');
const cache = new Map<string, string>();

/** 读取 `src/prompts/` 下的文本（带缓存）。 */
export function readPromptFile(...segments: string[]): string {
  const rel = path.join(...segments);
  const cached = cache.get(rel);
  if (cached !== undefined) return cached;

  const absolute = path.join(PROMPTS_ROOT, rel);
  const text = readFileSync(absolute, 'utf8').trim();
  cache.set(rel, text);
  return text;
}

function assertCharacterFile(slug: string, ...segments: string[]): void {
  const absolute = path.join(PROMPTS_ROOT, 'characters', slug, ...segments);
  if (!existsSync(absolute)) {
    throw new Error(`未知角色 prompt: ${slug}`);
  }
}

/** 加载角色画像 JSON（字符串值可含 `{{name}}` 等占位符）。 */
export function loadCharacterProfile(slug: string): JsonObject {
  assertCharacterFile(slug, 'profile.json');
  const parsed: unknown = JSON.parse(readPromptFile('characters', slug, 'profile.json'));
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`角色画像须为 JSON 对象: ${slug}`);
  }
  return parsed as JsonObject;
}

/** 加载角色可用的 skill id 列表（如 searchChatHistory）。 */
export function loadCharacterSkills(slug: string): string[] {
  assertCharacterFile(slug, 'skills.json');
  const parsed = JSON.parse(readPromptFile('characters', slug, 'skills.json')) as {
    skills?: string[];
  };
  return Array.isArray(parsed.skills) ? parsed.skills : [];
}

/** 加载角色对某条流水线 job 的补充提示（`characters/{slug}/jobs/{job}.md`）。 */
export function readCharacterJobPrompt(slug: string, job: CharacterJobPromptId): string {
  assertCharacterFile(slug, 'jobs', `${job}.md`);
  return readPromptFile('characters', slug, 'jobs', `${job}.md`);
}

const JOB_PROMPT_READERS: Record<JobPromptId, () => string> = {
  maintain: () => readPromptFile('jobs', 'maintain.md'),
  'user-profile': () => readPromptFile('jobs', 'user-profile.md'),
};

/** 读取流水线 job 的通用 system prompt（不含 extract；extract 在调用处与角色层拼接）。 */
export function readJobPrompt(job: JobPromptId): string {
  const reader = JOB_PROMPT_READERS[job];
  if (!reader) {
    throw new Error(`未知 job prompt: ${String(job)}`);
  }
  return reader();
}
