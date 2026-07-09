import { isMemoryType, type MemoryType } from '@/types/memory';

const DEFAULT_CONFIDENCE = 0.7;

export interface ParsedMemoryMetadata {
  type?: MemoryType;
  confidence: number;
  lastActiveAt: number;
}

/** 从未知值解析记忆类型，非法时返回 undefined。 */
export function parseMemoryType(value: unknown): MemoryType | undefined {
  if (!isMemoryType(value)) {
    return undefined;
  }
  return value;
}

/** 从未知值解析置信度，非法时返回默认值。 */
export function parseConfidence(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_CONFIDENCE;
  }
  return value;
}

/** 从 Chroma metadata 解析最后活跃时间，优先 last_active_at，其次 timestamp。 */
export function parseLastActiveAt(
  meta: Record<string, unknown> | null | undefined,
  fallbackMs: number,
): number {
  if (meta && typeof meta.last_active_at === 'number') {
    return meta.last_active_at;
  }
  if (meta && typeof meta.timestamp === 'number') {
    return meta.timestamp;
  }
  return fallbackMs;
}

/** 解析 Chroma 记忆 metadata 中的 type、confidence、lastActiveAt。 */
export function parseMemoryMetadata(
  meta: Record<string, unknown> | null | undefined,
  nowMs: number,
): ParsedMemoryMetadata {
  return {
    type: parseMemoryType(meta?.type),
    confidence: parseConfidence(meta?.confidence),
    lastActiveAt: parseLastActiveAt(meta, nowMs),
  };
}
