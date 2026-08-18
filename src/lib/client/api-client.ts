export class ApiClientError extends Error {
  readonly code: string | undefined;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
  }
}

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

export async function parseApiResponse<T>(res: Response): Promise<T> {
  const json = (await res.json()) as ApiResponse<T>;
  if (!json.success) {
    throw new ApiClientError(json.error ?? '请求失败', json.code);
  }
  return json.data;
}
