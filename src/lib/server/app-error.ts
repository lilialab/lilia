import { API_ERROR_CODE, type ApiErrorCode } from '@/types/api-error';

export class AppError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;

  constructor(status: number, message: string, code: ApiErrorCode) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
  }

  static badRequest(message: string, code: ApiErrorCode = API_ERROR_CODE.INVALID_REQUEST) {
    return new AppError(400, message, code);
  }

  static notFound(message: string, code: ApiErrorCode = API_ERROR_CODE.NOT_FOUND) {
    return new AppError(404, message, code);
  }

  static unauthorized(message: string, code: ApiErrorCode = API_ERROR_CODE.UNAUTHORIZED) {
    return new AppError(401, message, code);
  }

  static conflict(message: string, code: ApiErrorCode = API_ERROR_CODE.CONFLICT) {
    return new AppError(409, message, code);
  }

  static tooManyRequests(message: string, code: ApiErrorCode = API_ERROR_CODE.RATE_LIMITED) {
    return new AppError(429, message, code);
  }

  static internal(message: string, code: ApiErrorCode = API_ERROR_CODE.INTERNAL_ERROR) {
    return new AppError(500, message, code);
  }
}
