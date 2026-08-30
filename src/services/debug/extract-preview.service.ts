import { AppError } from '@/lib/server/app-error';
import { logger } from '@/lib/server/logger';
import { DEFAULT_CHARACTER_ID, listCharacterSlugs } from '@/prompts/load';
import {
  buildMockExtractTranscript,
  type ExtractMockMessage,
} from '@/services/debug/extract-mock.utils';
import { generateExtractModelOutput } from '@/services/memory/extract.service';
import { mapExtractOutput, validateAndMergeIds } from '@/services/memory/extract.utils';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

const FIXTURES_DIR = path.join(process.cwd(), 'src/services/debug/fixtures/extract');

const extractFixtureSchema = z.object({
  label: z.string().min(1),
  messages: z.array(
    z.object({
      speaker: z.string().trim().min(1),
      text: z.string().min(1),
    }),
  ).min(1),
});

export interface ExtractDebugFixture {
  id: string;
  label: string;
  messages: ExtractMockMessage[];
}

export interface ExtractPreviewResult {
  characterSlug: string;
  systemPrompt: string;
  userPrompt: string;
  transcript: string;
  messageIds: string[];
  rawText: string;
  error: string | undefined;
  memories: {
    text: string;
    type: string;
    confidence: number;
    sourceMessageIds: string[];
  }[];
  extractedIds: string[];
  deferredIds: string[];
  droppedInvalidIdTexts: string[];
}

/** 列出提取调试夹具（文件名去 .json 为 id）。 */
export function listExtractFixtures(): ExtractDebugFixture[] {
  if (!existsSync(FIXTURES_DIR)) return [];
  return readdirSync(FIXTURES_DIR)
    .filter((name) => name.endsWith('.json'))
    .toSorted()
    .flatMap((name) => {
      const id = name.slice(0, -'.json'.length);
      const parsed: unknown = JSON.parse(readFileSync(path.join(FIXTURES_DIR, name), 'utf8'));
      const fixture = extractFixtureSchema.safeParse(parsed);
      if (!fixture.success) {
        logger.warn({ name, issues: fixture.error.issues }, '[debug] 跳过非法提取夹具');
        return [];
      }
      return [{ id, label: fixture.data.label, messages: fixture.data.messages }];
    });
}

/** 调试页元数据：角色 slug + 夹具。 */
export function getExtractDebugMeta(): {
  characters: string[];
  defaultCharacter: string;
  fixtures: ExtractDebugFixture[];
} {
  const characters = listCharacterSlugs();
  const defaultCharacter = characters.includes(DEFAULT_CHARACTER_ID)
    ? DEFAULT_CHARACTER_ID
    : (characters[0] ?? '');
  return {
    characters,
    defaultCharacter,
    fixtures: listExtractFixtures(),
  };
}

/** 提取 dry-run：不写库、不标已提取。 */
export async function previewExtract(
  characterSlug: string,
  messages: ExtractMockMessage[],
): Promise<ExtractPreviewResult> {
  if (!listCharacterSlugs().includes(characterSlug)) {
    throw AppError.notFound('未知角色');
  }

  const { transcript, messageIds } = buildMockExtractTranscript(messages, characterSlug);
  if (messageIds.length === 0) {
    throw AppError.badRequest('没有有效消息');
  }

  logger.info({
    event: 'llm.extract.preview.request',
    characterSlug,
    messageCount: messageIds.length,
    transcript,
  });

  const { systemPrompt, userPrompt, output, text, error } = await generateExtractModelOutput(
    characterSlug,
    transcript,
  );

  if (error || !output) {
    return {
      characterSlug,
      systemPrompt,
      userPrompt,
      transcript,
      messageIds,
      rawText: text,
      error: error ?? '模型输出格式无效，无法解析',
      memories: [],
      extractedIds: [],
      deferredIds: messageIds,
      droppedInvalidIdTexts: [],
    };
  }

  const parsed = mapExtractOutput(output);
  const validated = validateAndMergeIds(parsed, messageIds);

  return {
    characterSlug,
    systemPrompt,
    userPrompt,
    transcript,
    messageIds,
    rawText: text,
    error: undefined,
    memories: validated.finishedMemories,
    extractedIds: validated.extractedIds,
    deferredIds: validated.deferredIds,
    droppedInvalidIdTexts: validated.droppedInvalidIdTexts,
  };
}
