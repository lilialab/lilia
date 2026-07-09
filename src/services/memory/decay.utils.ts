export type { MemoryType } from '@/types/memory';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** 按记忆类型返回半衰期（天）。 */
export function getHalfLifeDays(type?: string): number {
  if (type === 'event') return 30;
  return 90;
}

/** 指数时间衰减：halfLifeDays 天后权重约为 0.5。 */
export function decay(lastActiveAtMs: number, nowMs: number, halfLifeDays: number): number {
  const days = (nowMs - lastActiveAtMs) / MS_PER_DAY;
  if (days <= 0) return 1;
  return Math.exp((-Math.LN2 * days) / halfLifeDays);
}

/** 将 Chroma 距离转为相似度（距离越小越相似）。 */
export function similarityFromDistance(distance: number): number {
  return 1 / (1 + distance);
}

/** 综合相似度、置信度与时间衰减的有效得分。 */
export function effectiveScore(
  distance: number,
  confidence: number,
  lastActiveAtMs: number,
  nowMs: number,
  type?: string,
): number {
  const halfLife = getHalfLifeDays(type);
  return similarityFromDistance(distance) * confidence * decay(lastActiveAtMs, nowMs, halfLife);
}
