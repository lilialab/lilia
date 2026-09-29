import { type NextRequest } from 'next/server';

/** 从反向代理头解析客户端 IP；无法识别时返回 `unknown`。 */
export function getRequestClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }

  const realIp = req.headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;

  return 'unknown';
}
