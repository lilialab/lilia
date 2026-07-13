export const DEFAULT_CLIENT_TIME_ZONE = 'Asia/Shanghai';

/** 读取浏览器 IANA 时区（仅客户端调用）。 */
export function getBrowserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/** 判断是否为合法 IANA 时区标识。 */
export function isValidIanaTimeZone(timeZone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone });
    return true;
  } catch {
    return false;
  }
}

/** 校验并规范化客户端时区；缺省或非法时回退 DEFAULT_CLIENT_TIME_ZONE。 */
export function normalizeClientTimeZone(input?: string): string {
  const trimmed = input?.trim();
  if (!trimmed || !isValidIanaTimeZone(trimmed)) {
    return DEFAULT_CLIENT_TIME_ZONE;
  }
  return trimmed;
}

/** 将 UTC 时刻格式化为指定时区的本地时间字符串（yyyy-MM-dd HH:mm:ss）。 */
export function formatLocalDateTime(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
}
