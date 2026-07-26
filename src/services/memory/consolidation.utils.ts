import { isMemoryType, type MemoryType } from '@/types/memory';

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type { MemoryType };

export interface FinishedMemory {
  text: string;
  type: MemoryType;
  sourceMessageIds: string[];
  confidence: number;
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
    confidence: unknown;
  }[];
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/** 群 extract 是否纳入该消息（排除 turn_cue）。 */
export function isIncludedInGroupExtract(kind: string | null | undefined): boolean {
  return kind !== 'turn_cue';
}

/**
 * transcript 说话人标签：用户；群聊助理用 slug；单聊助理默认「阿尔博」。
 */
export function consolidationSpeakerLabel(
  role: string,
  options?: { assistantSlug?: string | null; singleChatAssistantName?: string },
): string {
  if (role === 'user') return '用户';
  const slug = options?.assistantSlug?.trim();
  if (slug) return slug;
  return options?.singleChatAssistantName ?? '阿尔博';
}

/** 将记忆按角色列表展开为写入输入（全员扇出）。 */
export function fanOutMemoriesToCharacters(
  memories: { text: string; type: MemoryType; confidence: number }[],
  userId: string,
  characterIds: string[],
): {
  userId: string;
  characterId: string;
  text: string;
  type: MemoryType;
  confidence: number;
}[] {
  return characterIds.flatMap((characterId) =>
    memories.map((memory) => ({
      userId,
      characterId,
      text: memory.text,
      type: memory.type,
      confidence: memory.confidence,
    }))
  );
}

/** 从未知值解析非空字符串数组，非法输入返回空数组。 */
function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.length > 0);
}

/** 解析 0~1 范围内的置信度，非法时返回 null。 */
function parseConfidence(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  if (value < 0 || value > 1) return null;
  return value;
}

/* -------------------------------------------------------------------------- */
/* Parsing                                                                    */
/* -------------------------------------------------------------------------- */

/** 校验并解析单条 LLM finished_memory 输出，不合法时返回 null。 */
export function parseFinishedMemoryItem(item: unknown): FinishedMemory | null {
  if (typeof item !== 'object' || item === null) return null;

  const record = item as Record<string, unknown>;
  const text = typeof record.text === 'string' ? record.text.trim() : '';
  const type = record.type;
  const sourceMessageIds = parseStringArray(record.source_message_ids);
  const confidence = parseConfidence(record.confidence);

  if (
    !text
    || typeof type !== 'string'
    || !isMemoryType(type)
    || sourceMessageIds.length === 0
    || confidence === null
  ) {
    return null;
  }

  return { text, type, sourceMessageIds, confidence };
}

/** 批量解析模型输出，过滤掉无效记忆条目。 */
export function mapConsolidationOutput(raw: ConsolidationOutputRaw): ConsolidationParseResult {
  const finishedMemories = raw.finished_memories.flatMap((item) => {
    const parsed = parseFinishedMemoryItem(item);
    return parsed === null ? [] : [parsed];
  });

  return { finishedMemories };
}

/* -------------------------------------------------------------------------- */
/* ID validation & merge                                                      */
/* -------------------------------------------------------------------------- */

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

  const { finishedMemories, droppedInvalidIdTexts } = parsed.finishedMemories.reduce<{
    finishedMemories: FinishedMemory[];
    droppedInvalidIdTexts: string[];
  }>(
    (acc, memory) => {
      const validSourceIds = memory.sourceMessageIds.filter((id) => allowedIds.has(id));
      const hasInvalidId = validSourceIds.length !== memory.sourceMessageIds.length;

      if (hasInvalidId) {
        acc.droppedInvalidIdTexts.push(memory.text);
        return acc;
      }

      if (validSourceIds.length === 0) return acc;

      acc.finishedMemories.push({ ...memory, sourceMessageIds: validSourceIds });
      return acc;
    },
    { finishedMemories: [], droppedInvalidIdTexts: [] },
  );

  /** 无可 consolidated 前缀时的空结果（全部 defer）。 */
  const emptyValidated: ValidatedConsolidation = {
    finishedMemories,
    consolidatedIds: [],
    deferredIds: [...messageIds],
    droppedInvalidIdTexts,
  };

  const lastMemory = finishedMemories.at(-1);
  if (!lastMemory) {
    return emptyValidated;
  }

  const indices = lastMemory.sourceMessageIds.flatMap((id) => {
    const index = idToIndex.get(id);
    return index === undefined ? [] : [index];
  });

  if (indices.length === 0) {
    return emptyValidated;
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
