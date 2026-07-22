export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function parseApiResponse<T>(res: Response): Promise<T> {
  const json = (await res.json()) as ApiResponse<T>;
  if (!json.success) {
    throw new Error(json.error ?? '请求失败');
  }
  return json.data;
}
