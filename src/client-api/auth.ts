import type { Locale } from '@/i18n/config';
import { apiFetchJson } from '@/lib/client/api-fetch';
import type { ChangePasswordBody } from '@/schemas/api/auth/change-password';
import type { DeleteAccountBody } from '@/schemas/api/auth/delete-account';
import type { LoginBody } from '@/schemas/api/auth/login';
import type { RegisterBody } from '@/schemas/api/auth/register';

export interface AuthUser {
  id: string;
  account: string;
  nickname: string;
  hasAvatar: boolean;
  locale: Locale;
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
    json: input,
  });
}

/** 注册并写入 session Cookie。 */
export async function register(input: RegisterBody): Promise<void> {
  await apiFetchJson('/api/auth/register', {
    method: 'POST',
    json: input,
  });
}

/** 退出登录并清除 session Cookie。 */
export async function logout(): Promise<void> {
  await apiFetchJson<Record<string, never>>('/api/auth/logout', {
    method: 'POST',
  });
}

/** 修改登录密码。 */
export async function changePassword(input: ChangePasswordBody): Promise<void> {
  await apiFetchJson('/api/auth/change-password', {
    method: 'POST',
    json: input,
  });
}

/** 永久删除当前用户账号。 */
export async function deleteAccount(input: DeleteAccountBody): Promise<void> {
  await apiFetchJson('/api/auth/delete-account', {
    method: 'POST',
    json: input,
  });
}

/** 更新当前用户的界面语言偏好。 */
export async function updateUserLocale(locale: Locale): Promise<AuthUser> {
  const data = await apiFetchJson<{ user: AuthUser }>('/api/auth/me', {
    method: 'PATCH',
    json: { locale },
  });
  return data.user;
}

/** 更新当前用户的昵称。 */
export async function updateUserNickname(nickname: string): Promise<AuthUser> {
  const data = await apiFetchJson<{ user: AuthUser }>('/api/auth/me', {
    method: 'PATCH',
    json: { nickname },
  });
  return data.user;
}

/** 上传当前用户头像。 */
export async function uploadUserAvatar(file: File): Promise<AuthUser> {
  const form = new FormData();
  form.append('file', file);
  const data = await apiFetchJson<{ user: AuthUser }>('/api/auth/me/avatar', {
    method: 'POST',
    body: form,
  });
  return data.user;
}

/** 登录用户可读的头像地址（浏览器带 Cookie 拉字节）。 */
export function userAvatarUrl(userId: string, updatedAt: string): string {
  return `/api/users/${encodeURIComponent(userId)}/avatar?v=${encodeURIComponent(updatedAt)}`;
}
