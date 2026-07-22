import { apiFetchJson } from '@/lib/client/api-fetch';
import type { LoginBody } from '@/schemas/api/auth/login';
import type { RegisterBody } from '@/schemas/api/auth/register';

export interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  timeZone: string;
  createdAt: string;
  updatedAt: string;
}

/** 获取当前登录用户；未登录时返回 null。 */
export async function fetchCurrentUser(): Promise<AuthUser | null> {
  const data = await apiFetchJson<{ user: AuthUser } | null>('/api/auth/me', {
    nullOnUnauthorized: true,
  });
  return data?.user ?? null;
}

/** 登录并写入 session Cookie。 */
export async function login(input: LoginBody): Promise<void> {
  await apiFetchJson('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

/** 注册并写入 session Cookie。 */
export async function register(input: RegisterBody): Promise<void> {
  await apiFetchJson('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

/** 退出登录并清除 session Cookie。 */
export async function logout(): Promise<void> {
  await apiFetchJson<Record<string, never>>('/api/auth/logout', {
    method: 'POST',
  });
}
