import type { ExtractedMemory } from '@/types/consolidation-job';

export type MemoryType = ExtractedMemory['type'];

const VALID_MEMORY_TYPES = new Set<MemoryType>(['preference', 'event', 'fact']);

export interface FinishedMemory {
  text: string;
  type: MemoryType;
  sourceMessageIds: string[];
}

export interface ConsolidationParseResult {
  finishedMemories: FinishedMemory[];
}

export interface ValidatedConsolidation {
  finishedMemories: FinishedMemory[];
  consolidatedIds: string[];
  deferredIds: string[];
  droppedInvalidIdTexts: string[];
}

export interface ConsolidationOutputRaw {
  finished_memories: {
    text: string;
    type: string;
    source_message_ids: unknown;
  }[];
}

function isMemoryType(value: string): value is MemoryType {
  return VALID_MEMORY_TYPES.has(value as MemoryType);
}

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.length > 0);
}

export function parseFinishedMemoryItem(item: unknown): FinishedMemory | null {
  if (typeof item !== 'object' || item === null) return null;

  const record = item as Record<string, unknown>;
  const text = typeof record.text === 'string' ? record.text.trim() : '';
  const type = record.type;
  const sourceMessageIds = parseStringArray(record.source_message_ids);

  if (!text || typeof type !== 'string' || !isMemoryType(type) || sourceMessageIds.length === 0) {
    return null;
  }

  return { text, type, sourceMessageIds };
}

export function mapConsolidationOutput(raw: ConsolidationOutputRaw): ConsolidationParseResult {
  const finishedMemories = raw.finished_memories
    .map(parseFinishedMemoryItem)
    .filter((item): item is FinishedMemory => item !== null);

  return { finishedMemories };
}

/**
 * 校验模型输出，并按 globalMax 前缀标记 consolidated：
 * globalMax = 时间顺序最后一条 finished_memory 的 source 最大下标；
 * consolidatedIds = messageIds[0..globalMax]。
 */
export function validateAndMergeIds(
  parsed: ConsolidationParseResult,
  messageIds: string[],
): ValidatedConsolidation {
  const allowedIds = new Set(messageIds);
  const idToIndex = new Map(messageIds.map((id, index) => [id, index]));

  const finishedMemories: FinishedMemory[] = [];
  const droppedInvalidIdTexts: string[] = [];

  for (const memory of parsed.finishedMemories) {
    const validSourceIds = memory.sourceMessageIds.filter((id) => allowedIds.has(id));
    const hasInvalidId = validSourceIds.length !== memory.sourceMessageIds.length;

    if (hasInvalidId) {
      droppedInvalidIdTexts.push(memory.text);
      continue;
    }

    if (validSourceIds.length === 0) continue;

    finishedMemories.push({ ...memory, sourceMessageIds: validSourceIds });
  }

  if (finishedMemories.length === 0) {
    return {
      finishedMemories,
      consolidatedIds: [],
      deferredIds: [...messageIds],
      droppedInvalidIdTexts,
    };
  }

  const lastMemory = finishedMemories[finishedMemories.length - 1];
  const indices = lastMemory.sourceMessageIds
    .map((id) => idToIndex.get(id))
    .filter((index): index is number => index !== undefined);

  if (indices.length === 0) {
    return {
      finishedMemories,
      consolidatedIds: [],
      deferredIds: [...messageIds],
      droppedInvalidIdTexts,
    };
  }

  const globalMax = Math.max(...indices);
  const consolidatedIds = messageIds.slice(0, globalMax + 1);
  const deferredIds = messageIds.slice(globalMax + 1);

  return {
    finishedMemories,
    consolidatedIds,
    deferredIds,
    droppedInvalidIdTexts,
  };
}
