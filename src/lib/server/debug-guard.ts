import { AppError } from '@/lib/server/app-error';
import { env } from '@/lib/server/env';

/** development 以外的 debug 路由视为不存在。 */
export function assertDevelopmentDebug(): void {
  if (env.NODE_ENV !== 'development') {
    throw AppError.notFound('Not Found');
  }
}
