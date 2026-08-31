import { logger } from '@/lib/server/logger';
import { generateMaintainModelOutput } from '@/services/memory/maintain.service';
import {
  type MaintainClusterNeighbor,
  type MaintainMemoryItem,
  mapMaintainRewriteOutput,
  validateMaintainRewriteOutput,
} from '@/services/memory/maintain.utils';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

const FIXTURES_DIR = path.join(process.cwd(), 'src/services/debug/fixtures/maintain');

const maintainFixtureSchema = z.object({
  label: z.string().min(1),
  cursor: z.object({
    text: z.string().trim().min(1),
    type: z.enum(['event', 'fact']),
    confidence: z.number().min(0).max(1),
  }),
  neighbors: z.array(
    z.object({
      text: z.string().trim().min(1),
      type: z.enum(['event', 'fact']),
      confidence: z.number().min(0).max(1),
      distance: z.number(),
    }),
  ).min(1),
});

export interface MaintainDebugFixture {
  id: string;
  label: string;
  cursor: MaintainMemoryItem;
  neighbors: MaintainClusterNeighbor[];
}

export interface MaintainPreviewResult {
  systemPrompt: string;
  userPrompt: string;
  rawText: string;
  error: string | undefined;
  memories: MaintainMemoryItem[];
  inputCount: number;
}

/** 列出维护调试夹具（文件名去 .json 为 id）。 */
export function listMaintainFixtures(): MaintainDebugFixture[] {
  if (!existsSync(FIXTURES_DIR)) return [];
  return readdirSync(FIXTURES_DIR)
    .filter((name) => name.endsWith('.json'))
    .toSorted()
    .flatMap((name) => {
      const id = name.slice(0, -'.json'.length);
      const parsed: unknown = JSON.parse(readFileSync(path.join(FIXTURES_DIR, name), 'utf8'));
      const fixture = maintainFixtureSchema.safeParse(parsed);
      if (!fixture.success) {
        logger.warn({ name, issues: fixture.error.issues }, '[debug] 跳过非法维护夹具');
        return [];
      }
      return [{
        id,
        label: fixture.data.label,
        cursor: fixture.data.cursor,
        neighbors: fixture.data.neighbors,
      }];
    });
}

/** 调试页元数据：维护夹具。 */
export function getMaintainDebugMeta(): { fixtures: MaintainDebugFixture[] } {
  return { fixtures: listMaintainFixtures() };
}

/** 维护 dry-run：不写库、不标 isMaintained。 */
export async function previewMaintain(
  cursor: MaintainMemoryItem,
  neighbors: MaintainClusterNeighbor[],
): Promise<MaintainPreviewResult> {
  const inputCount = 1 + neighbors.length;

  logger.info({
    event: 'llm.maintain.preview.request',
    neighborCount: neighbors.length,
    inputCount,
  });

  const { systemPrompt, userPrompt, output, text, error } = await generateMaintainModelOutput(
    cursor,
    neighbors,
  );

  if (error || !output) {
    return {
      systemPrompt,
      userPrompt,
      rawText: text,
      error: error ?? '维护模型输出格式无效',
      memories: [],
      inputCount,
    };
  }

  const memories = mapMaintainRewriteOutput(output);
  const validation = validateMaintainRewriteOutput(memories, inputCount);

  return {
    systemPrompt,
    userPrompt,
    rawText: text,
    error: validation.ok ? undefined : validation.error,
    memories,
    inputCount,
  };
}
