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

export interface LocalClock {
  date: string;
  time: string;
  weekday: string;
  utcOffset: string;
}

/** 本地日历：日期、HH:mm、英文星期、该日 UTC 偏移（含 DST）。 */
export function formatLocalClock(date: Date, timeZone: string): LocalClock {
  const dateTimeParts = new Intl.DateTimeFormat('sv-SE', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    dateTimeParts.find((item) => item.type === type)?.value ?? '';

  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'long',
  }).format(date);

  const offsetName = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'longOffset',
    year: 'numeric',
  }).formatToParts(date).find((item) => item.type === 'timeZoneName')?.value;

  return {
    date: `${part('year')}-${part('month')}-${part('day')}`,
    time: `${part('hour')}:${part('minute')}`,
    weekday,
    utcOffset: normalizeUtcOffset(offsetName),
  };
}

function normalizeUtcOffset(timeZoneName: string | undefined): string {
  const match = timeZoneName?.match(/([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!match) return '+00:00';
  const sign = match[1];
  const hours = match[2].padStart(2, '0');
  const minutes = match[3] ?? '00';
  return `${sign}${hours}:${minutes}`;
}
