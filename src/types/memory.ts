export type MemoryType = 'event' | 'fact';

/** 判断未知值是否为记忆类型。 */
export function isMemoryType(value: unknown): value is MemoryType {
  return value === 'event' || value === 'fact';
}
