export type MemoryType = 'preference' | 'event' | 'fact';

const VALID_MEMORY_TYPES = new Set<MemoryType>(['preference', 'event', 'fact']);

/** 判断未知值是否为合法记忆类型。 */
export function isMemoryType(value: unknown): value is MemoryType {
  return typeof value === 'string' && VALID_MEMORY_TYPES.has(value as MemoryType);
}
