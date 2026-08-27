import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

export const DEFAULT_CHARACTER_ID = 'lilia';

export type JobPromptId = 'maintain' | 'profile';

export interface CharacterPrompt {
  id: string;
  persona: string;
  /** 角色基础档案 KV 正文（含 `{{name}}` 等占位符）。 */
  profile: string;
  /** 角色可用的 skill id 列表（如 searchChatHistory）。 */
  skills: string[];
}

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

function loadCharacterSkills(slug: string): string[] {
  const raw = readPromptFile('characters', slug, 'skills.json');
  const parsed = JSON.parse(raw) as { skills?: string[] };
  return Array.isArray(parsed.skills) ? parsed.skills : [];
}

/** 加载角色人设（persona.md + profile.md + skills.json）；slug 对齐 characters/{slug}/ 目录。 */
export function loadCharacter(slug: string): CharacterPrompt {
  const personaPath = path.join(PROMPTS_ROOT, 'characters', slug, 'persona.md');
  if (!existsSync(personaPath)) {
    throw new Error(`未知角色 prompt: ${slug}`);
  }

  return {
    id: slug,
    persona: readPromptFile('characters', slug, 'persona.md'),
    profile: readPromptFile('characters', slug, 'profile.md'),
    skills: loadCharacterSkills(slug),
  };
}

const JOB_PROMPT_LOADERS: Record<JobPromptId, () => string> = {
  maintain: () => readPromptFile('jobs', 'maintain.md'),
  profile: () => readPromptFile('jobs', 'profile.md'),
};

/** 加载流水线 job 的 system prompt（不含 extract）。 */
export function loadJobPrompt(job: JobPromptId): string {
  const loader = JOB_PROMPT_LOADERS[job];
  if (!loader) {
    throw new Error(`未知 job prompt: ${String(job)}`);
  }
  return loader();
}
