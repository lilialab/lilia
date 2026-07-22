import { AppError } from '@/lib/server/app-error';
import { logger } from '@/lib/server/logger';
import { type NextRequest, NextResponse } from 'next/server';

type ApiHandlerContext = {
  params: Promise<unknown>;
};

type ApiRouteHandler<C extends ApiHandlerContext> = (
  req: NextRequest,
  context: C,
) => Promise<Response> | Response;

export function withApiHandler<C extends ApiHandlerContext>(
  handler: ApiRouteHandler<C>,
): ApiRouteHandler<C> {
  return async (req: NextRequest, context: C) => {
    try {
      const response = await handler(req, context);

      return response;
    } catch (error: unknown) {
      if (error instanceof AppError) {
        const logPayload = {
          method: req.method,
          path: req.nextUrl.pathname,
          status: error.status,
          err: error,
        };

        if (error.status < 500) {
          logger.warn(logPayload, '[API_ERROR_INTERCEPTED]');
        } else {
          logger.error(logPayload, '[API_ERROR_INTERCEPTED]');
        }

        return NextResponse.json(
          { success: false, error: error.message },
          { status: error.status },
        );
      }

      logger.error(
        { method: req.method, path: req.nextUrl.pathname, err: error },
        '[API_ERROR_INTERCEPTED]',
      );

      const errorMessage = error instanceof Error ? error.message : '服务器内部异常';

      return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }
  };
}

/** 在 UI Message Stream 的 start 事件写入 metadata。 */
export function withMessageMetadata<T>(metadata: T) {
  return {
    messageMetadata: ({ part }: { part: { type: string } }) => {
      if (part.type === 'start') return metadata;
    },
  };
}

/** 抛出 400 客户端错误 */
export function badRequest(message: string): never {
  throw AppError.badRequest(message);
}

/** 抛出 404 资源不存在 */
export function notFound(message: string): never {
  throw AppError.notFound(message);
}

/** 快速返回 200 成功响应（data 必填）。 */
export function successResponse<T>(data: T) {
  return NextResponse.json({
    success: true,
    data,
  });
}
