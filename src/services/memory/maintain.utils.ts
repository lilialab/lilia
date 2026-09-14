import { env } from '@/lib/server/env';
import { isMemoryType, type MemoryType } from '@/types/memory';
import { decay, getHalfLifeDays } from './decay.utils';

export interface MaintainMemoryItem {
  text: string;
  type: MemoryType;
  confidence: number;
}

export interface MaintainRewriteOutputRaw {
  memories: unknown[];
}

export interface MaintainClusterNeighbor extends MaintainMemoryItem {
  distance: number;
}

/** 组装游标 + 近邻的 LLM 用户 prompt（序号 1 为游标）。 */
export function buildMaintainPrompt(
  cursor: MaintainMemoryItem,
  neighbors: MaintainClusterNeighbor[],
): string {
  const lines = [
    `1. [cursor, ${cursor.type}, confidence=${cursor.confidence.toFixed(2)}] ${cursor.text}`,
  ];

  neighbors.forEach((neighbor, index) => {
    lines.push(
      `${index + 2}. [neighbor, distance=${
        neighbor.distance.toFixed(3)
      }, ${neighbor.type}, confidence=${neighbor.confidence.toFixed(2)}] ${neighbor.text}`,
    );
  });

  return lines.join('\n');
}

/** 解析 0~1 范围内的置信度，非法时返回 null。 */
function parseConfidence(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  if (value < 0 || value > 1) return null;
  return value;
}

/** 解析单条 LLM 维护记忆输出，不合法时返回 null。 */
export function parseMaintainMemoryItem(item: unknown): MaintainMemoryItem | null {
  if (typeof item !== 'object' || item === null) return null;

  const text = 'text' in item && typeof item.text === 'string' ? item.text.trim() : '';
  const type = 'type' in item && isMemoryType(item.type) ? item.type : undefined;
  const confidence = 'confidence' in item ? parseConfidence(item.confidence) : null;

  if (!text || type === undefined || confidence === null) {
    return null;
  }

  return { text, type, confidence };
}

/** 批量解析维护输出，过滤掉无效记忆条目。 */
export function mapMaintainRewriteOutput(
  raw: MaintainRewriteOutputRaw,
): MaintainMemoryItem[] {
  if (!Array.isArray(raw.memories)) return [];

  return raw.memories.flatMap((item) => {
    const parsed = parseMaintainMemoryItem(item);
    return parsed === null ? [] : [parsed];
  });
}

/**
 * 校验 LLM 维护产出条数：至少 1 条（防全删无建），不超过输入簇条数。
 */
export function validateMaintainRewriteOutput(
  memories: MaintainMemoryItem[],
  inputCount: number,
): { ok: true } | { ok: false; error: string } {
  if (memories.length === 0) {
    return { ok: false, error: '维护输出 memories 不能为空' };
  }

  if (memories.length > inputCount) {
    return {
      ok: false,
      error: `维护输出条数 ${memories.length} 超过输入条数 ${inputCount}`,
    };
  }

  return { ok: true };
}

/** 删除范围由代码固定，不交给 LLM，避免误删库外 id。 */
export function buildMaintainClusterDeleteIds(
  cursorId: string,
  neighborIds: string[],
): string[] {
  return [...new Set([cursorId, ...neighborIds])];
}

/** 记忆是否应进入维护游标池（纯函数，便于单测）。 */
export function isMaintainCursorCandidate(isMaintained: boolean, isDeleted: boolean): boolean {
  return !isDeleted && !isMaintained;
}

/**
 * 维护近邻是否仍足够活跃可进入 LLM 簇。
 * 半衰期见 env（MEMORY_HALF_LIFE_*）；默认阈值见 MEMORY_MAINTAIN_NEIGHBOR_MIN_DECAY。
 */
export function isMaintainNeighborActive(
  lastActiveAtMs: number,
  nowMs: number,
  type?: string,
  minDecay = env.MEMORY_MAINTAIN_NEIGHBOR_MIN_DECAY,
): boolean {
  return decay(lastActiveAtMs, nowMs, getHalfLifeDays(type)) >= minDecay;
}
