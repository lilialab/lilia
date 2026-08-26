import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

export const DEFAULT_CHARACTER_ID = 'lilia';

export type JobPromptId = 'maintain' | 'profile';

export interface CharacterPrompt {
  id: string;
  persona: string;
  /** 角色可用的 skill id 列表（如 searchChatHistory）。 */
  skills: string[];
}

const PROMPTS_ROOT = path.join(process.cwd(), 'src/prompts');
const cache = new Map<string, string>();

function readPromptFile(...segments: string[]): string {
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

/** 加载平台共用安全约束。 */
export function loadPlatformSafety(): string {
  return readPromptFile('platform', 'safety.md');
}

/** 加载角色人设（skills.json + persona）；slug 对齐 characters/{slug}/ 目录。 */
export function loadCharacter(slug: string): CharacterPrompt {
  const personaPath = path.join(PROMPTS_ROOT, 'characters', slug, 'persona.md');
  if (!existsSync(personaPath)) {
    throw new Error(`未知角色 prompt: ${slug}`);
  }

  const persona = readPromptFile('characters', slug, 'persona.md');

  return {
    id: slug,
    persona,
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

/** 加载默认 extract prompt（core + guardrails）。 */
function loadDefaultExtractPrompt(): string {
  const core = readPromptFile('jobs', 'extract-core.md');
  const guardrails = readPromptFile('jobs', 'extract-local-guardrails.md');
  return `${core}\n\n${guardrails}`;
}

/** 按角色加载 extract prompt。默认规则始终包含；角色目录下 extract.md 存在时追加角色专属的提取重点。 */
export function loadExtractPrompt(characterId: string): string {
  const base = loadDefaultExtractPrompt();
  const charPath = path.join(PROMPTS_ROOT, 'characters', characterId, 'extract.md');
  if (!existsSync(charPath)) return base;

  const charFocus = readPromptFile('characters', characterId, 'extract.md');
  return `${base}\n\n${charFocus}`;
}
