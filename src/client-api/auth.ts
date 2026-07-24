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

/** 获取当前登录用户；未登录时由 apiFetchJson 统一踢回 /login。 */
export async function fetchCurrentUser(): Promise<AuthUser> {
  const data = await apiFetchJson<{ user: AuthUser }>('/api/auth/me');
  return data.user;
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
