/** 生成占用超过此时长视为僵死，允许新请求抢占（防进程崩溃永久锁死）。 */
export const GENERATION_LOCK_STALE_MS = 10 * 60 * 1000;

/** 根据 generatingStartedAt 判断会话是否仍处于有效生成中。 */
export function isGenerationBusy(
  generatingStartedAt: Date | null | undefined,
  nowMs: number = Date.now(),
): boolean {
  if (!generatingStartedAt) return false;
  return nowMs - generatingStartedAt.getTime() < GENERATION_LOCK_STALE_MS;
}

/** 早于此时间的占用可被抢占。 */
export function generationLockStaleBefore(nowMs: number = Date.now()): Date {
  return new Date(nowMs - GENERATION_LOCK_STALE_MS);
}
