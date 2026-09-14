import { isMemoryType, type MemoryType } from '@/types/memory';
import { collectTextParts } from '@/utils/message-parts';

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

export interface ExtractParseResult {
  finishedMemories: FinishedMemory[];
}

export interface ValidatedExtract {
  finishedMemories: FinishedMemory[];
  extractedIds: string[];
  deferredIds: string[];
  droppedInvalidIdTexts: string[];
}

export interface ExtractOutputRaw {
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
 * transcript 的 speaker 属性：用户为 `user`；助理为角色 slug（单聊 / 群聊一致）。
 * @param assistantSlug 非 user 消息必填；user 消息可省略
 */
export function extractSpeaker(role: string, assistantSlug?: string | null): string {
  if (role === 'user') return 'user';
  const slug = assistantSlug?.trim();
  if (slug) return slug;
  throw new Error('assistant 消息须指定 assistantSlug');
}

/** 从消息 parts 抽出纯文本。 */
export function textFromMessageParts(parts: unknown): string {
  return collectTextParts(parts)
    .map((part) => part.text)
    .join(' ')
    .trim();
}

/** 单条 extract transcript 的 XML；空正文返回 null。 */
export function formatExtractMessageXml(
  id: string,
  seq: number,
  speaker: string,
  text: string,
  localTime: string,
): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  return `<message id="${id}" seq="${seq}" speaker="${speaker}" local_time="${localTime}">${trimmed}</message>`;
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

  const text = 'text' in item && typeof item.text === 'string' ? item.text.trim() : '';
  const type = 'type' in item && isMemoryType(item.type) ? item.type : undefined;
  const sourceMessageIds = 'source_message_ids' in item
    ? parseStringArray(item.source_message_ids)
    : [];
  const confidence = 'confidence' in item ? parseConfidence(item.confidence) : null;

  if (
    !text
    || type === undefined
    || sourceMessageIds.length === 0
    || confidence === null
  ) {
    return null;
  }

  return { text, type, sourceMessageIds, confidence };
}

/** 批量解析模型输出，过滤掉无效记忆条目。 */
export function mapExtractOutput(raw: ExtractOutputRaw): ExtractParseResult {
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
 * 校验模型输出，并按 globalMax 前缀标记 extracted：
 * globalMax = 时间顺序最后一条 finished_memory 的 source 最大下标；
 * extractedIds = messageIds[0..globalMax]。
 */
export function validateAndMergeIds(
  parsed: ExtractParseResult,
  messageIds: string[],
): ValidatedExtract {
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

  /** 无可 extracted 前缀时的空结果（全部 defer）。 */
  const emptyValidated: ValidatedExtract = {
    finishedMemories,
    extractedIds: [],
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
  const extractedIds = messageIds.slice(0, globalMax + 1);
  const deferredIds = messageIds.slice(globalMax + 1);

  return {
    finishedMemories,
    extractedIds,
    deferredIds,
    droppedInvalidIdTexts,
  };
}
