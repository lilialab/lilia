import { readFileSync } from 'node:fs';
import path from 'node:path';

export const DEFAULT_CHARACTER_ID = 'arbor';

export type JobPromptId = 'extract' | 'maintain' | 'profile';

export interface CharacterPrompt {
  id: string;
  displayName: string;
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

/** 加载平台共用安全约束。 */
export function loadPlatformSafety(): string {
  return readPromptFile('platform', 'safety.md');
}

/** 加载角色人设（meta + persona）；slug 对齐 characters/{slug}/ 目录。 */
export function loadCharacter(slug: string = DEFAULT_CHARACTER_ID): CharacterPrompt {
  const metaRaw = readPromptFile('characters', slug, 'meta.json');
  const meta = JSON.parse(metaRaw) as {
    id: string;
    displayName: string;
    skills?: string[];
  };
  const persona = readPromptFile('characters', slug, 'persona.md');

  if (meta.id !== slug) {
    throw new Error(`角色 meta.id (${meta.id}) 与目录名 (${slug}) 不一致`);
  }

  return {
    id: slug,
    displayName: meta.displayName,
    persona,
    skills: Array.isArray(meta.skills) ? meta.skills : [],
  };
}

const JOB_PROMPT_LOADERS: Record<JobPromptId, () => string> = {
  extract: () => {
    const core = readPromptFile('jobs', 'extract-core.md');
    const guardrails = readPromptFile('jobs', 'extract-local-guardrails.md');
    return `${core}\n\n${guardrails}`;
  },
  maintain: () => readPromptFile('jobs', 'maintain.md'),
  profile: () => readPromptFile('jobs', 'profile.md'),
};

/** 加载流水线 job 的 system prompt。 */
export function loadJobPrompt(job: JobPromptId): string {
  const loader = JOB_PROMPT_LOADERS[job];
  if (!loader) {
    throw new Error(`未知 job prompt: ${String(job)}`);
  }
  return loader();
}
