import { logger } from '@/lib/server/logger';
import { getCharacterDefinitionBySlug } from '@/services/character/definition.service';
import { generateProfileModelOutput } from '@/services/memory/user-profile.service';
import { type ProfileSnapshot, profileSnapshotSchema } from '@/services/memory/user-profile.utils';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { z } from 'zod';
import { listCatalogSlugs } from './catalog.service';

const FIXTURES_DIR = path.join(process.cwd(), 'src/services/debug/fixtures/profile');

const profileReferenceMemorySchema = z.object({
  text: z.string().trim().min(1),
  type: z.enum(['event', 'fact']),
  confidence: z.number().min(0).max(1),
});

const profileFixtureSchema = z.object({
  label: z.string().min(1),
  existing: profileSnapshotSchema,
  referenceMemories: z.array(profileReferenceMemorySchema),
});

export interface ProfileDebugFixture {
  id: string;
  label: string;
  existing: ProfileSnapshot;
  referenceMemories: { text: string; type: 'event' | 'fact'; confidence: number }[];
}

export interface ProfilePreviewResult {
  characterSlug: string;
  systemPrompt: string;
  userPrompt: string;
  rawText: string;
  error: string | undefined;
  snapshot: ProfileSnapshot | undefined;
  unchanged: boolean;
}

/** 列出画像调试夹具（文件名去 .json 为 id）。 */
export function listProfileFixtures(): ProfileDebugFixture[] {
  if (!existsSync(FIXTURES_DIR)) return [];
  return readdirSync(FIXTURES_DIR)
    .filter((name) => name.endsWith('.json'))
    .toSorted()
    .flatMap((name) => {
      const id = name.slice(0, -'.json'.length);
      const parsed: unknown = JSON.parse(readFileSync(path.join(FIXTURES_DIR, name), 'utf8'));
      const fixture = profileFixtureSchema.safeParse(parsed);
      if (!fixture.success) {
        logger.warn({ name, issues: fixture.error.issues }, '[debug] 跳过非法画像夹具');
        return [];
      }
      return [{
        id,
        label: fixture.data.label,
        existing: fixture.data.existing,
        referenceMemories: fixture.data.referenceMemories,
      }];
    });
}

/** 调试页元数据：库中角色 slug + 夹具。 */
export async function getProfileDebugMeta(): Promise<{
  characters: string[];
  defaultCharacter: string;
  fixtures: ProfileDebugFixture[];
}> {
  const characters = await listCatalogSlugs();
  return {
    characters,
    defaultCharacter: characters[0] ?? '',
    fixtures: listProfileFixtures(),
  };
}

/** 画像 dry-run：不写 UserProfile。 */
export async function previewProfile(
  characterSlug: string,
  existing: ProfileSnapshot,
  referenceMemories: { text: string; type: string; confidence: number }[],
): Promise<ProfilePreviewResult> {
  await getCharacterDefinitionBySlug(characterSlug);

  logger.info({
    event: 'llm.profile.preview.request',
    characterSlug,
    referenceMemoryCount: referenceMemories.length,
  });

  const { systemPrompt, userPrompt, output, text, error } = await generateProfileModelOutput(
    characterSlug,
    existing,
    referenceMemories,
  );

  if (error || !output) {
    return {
      characterSlug,
      systemPrompt,
      userPrompt,
      rawText: text,
      error: error ?? '画像模型输出格式无效',
      snapshot: undefined,
      unchanged: false,
    };
  }

  return {
    characterSlug,
    systemPrompt,
    userPrompt,
    rawText: text,
    error: undefined,
    snapshot: output,
    unchanged: isDeepStrictEqual(existing, output),
  };
}
