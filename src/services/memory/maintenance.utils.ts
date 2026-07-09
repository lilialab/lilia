import { isMemoryType, type MemoryType } from '@/types/memory';

export interface MaintenanceMemoryItem {
  text: string;
  type: MemoryType;
  confidence: number;
}

export interface MaintenanceRewriteOutputRaw {
  memories: unknown[];
}

/** 解析 0~1 范围内的置信度，非法时返回 null。 */
function parseConfidence(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  if (value < 0 || value > 1) return null;
  return value;
}

/** 解析单条 LLM 维护记忆输出，不合法时返回 null。 */
export function parseMaintenanceMemoryItem(item: unknown): MaintenanceMemoryItem | null {
  if (typeof item !== 'object' || item === null) return null;

  const record = item as Record<string, unknown>;
  const text = typeof record.text === 'string' ? record.text.trim() : '';
  const type = record.type;
  const confidence = parseConfidence(record.confidence);

  if (!text || typeof type !== 'string' || !isMemoryType(type) || confidence === null) {
    return null;
  }

  return { text, type, confidence };
}

/** 批量解析维护输出，过滤掉无效记忆条目。 */
export function mapMaintenanceRewriteOutput(
  raw: MaintenanceRewriteOutputRaw,
): MaintenanceMemoryItem[] {
  if (!Array.isArray(raw.memories)) return [];

  return raw.memories.flatMap((item) => {
    const parsed = parseMaintenanceMemoryItem(item);
    return parsed === null ? [] : [parsed];
  });
}

/**
 * 校验 LLM 维护产出条数：至少 1 条（防全删无建），不超过输入簇条数。
 */
export function validateMaintenanceRewriteOutput(
  memories: MaintenanceMemoryItem[],
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
export function buildMaintenanceClusterDeleteIds(
  cursorId: string,
  neighborIds: string[],
): string[] {
  return [...new Set([cursorId, ...neighborIds])];
}

/** 记忆是否应进入维护游标池（纯函数，便于单测）。 */
export function isMaintenanceCursorCandidate(
  createdAt: Date,
  isMaintained: boolean,
  isDeleted: boolean,
  lastMaintainedAt: Date | null,
): boolean {
  if (isDeleted || isMaintained) return false;
  if (!lastMaintainedAt) return true;
  return createdAt.getTime() > lastMaintainedAt.getTime();
}
