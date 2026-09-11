import { env } from '@/lib/server/env';
import { readFileSync } from 'node:fs';
import path from 'node:path';

export type JobPromptId = 'maintain' | 'user-profile';

const PROMPTS_ROOT = path.join(process.cwd(), 'src/prompts');
const cache = new Map<string, string>();

/** 读取 `src/prompts/` 下的文本。非 development 带缓存；本地改 md 可立刻生效。 */
export function readPromptFile(...segments: string[]): string {
  const rel = path.join(...segments);
  const useCache = env.NODE_ENV !== 'development';
  if (useCache) {
    const cached = cache.get(rel);
    if (cached !== undefined) return cached;
  }

  const absolute = path.join(PROMPTS_ROOT, rel);
  const text = readFileSync(absolute, 'utf8').trim();
  if (useCache) cache.set(rel, text);
  return text;
}

const JOB_PROMPT_READERS: Record<JobPromptId, () => string> = {
  maintain: () => readPromptFile('jobs', 'maintain.md'),
  'user-profile': () => readPromptFile('jobs', 'user-profile.md'),
};

/** 读取流水线 job 的通用 system prompt（不含 extract；extract 在角色表）。 */
export function readJobPrompt(job: JobPromptId): string {
  const reader = JOB_PROMPT_READERS[job];
  if (!reader) {
    throw new Error(`未知 job prompt: ${String(job)}`);
  }
  return reader();
}
