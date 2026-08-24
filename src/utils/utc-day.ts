/** UTC 日历日 `YYYY-MM-DD`。 */
export function formatUtcDate(now: Date): string {
  return now.toISOString().slice(0, 10);
}

/** 距下一个 UTC 午夜的秒数，至少为 1。 */
export function secondsUntilNextUtcMidnight(now: Date): number {
  const nextMidnightMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  return Math.max(1, Math.ceil((nextMidnightMs - now.getTime()) / 1000));
}
