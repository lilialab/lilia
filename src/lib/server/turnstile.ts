import { AppError } from '@/lib/server/app-error';
import { env } from '@/lib/server/env';
import { API_ERROR_CODE } from '@/types/api-error';

const TURNSTILE_SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

type TurnstileSiteverifyResponse = {
  success: boolean;
  'error-codes'?: string[];
};

/** 向 Cloudflare 校验 Turnstile token；失败抛 400。 */
export async function verifyTurnstileToken(token: string): Promise<void> {
  const body = new URLSearchParams({
    secret: env.TURNSTILE_SECRET_KEY,
    response: token,
  });

  let response: Response;
  try {
    response = await fetch(TURNSTILE_SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
  } catch {
    throw AppError.internal('人机验证服务暂不可用', API_ERROR_CODE.INTERNAL_ERROR);
  }

  if (!response.ok) {
    throw AppError.internal('人机验证服务暂不可用', API_ERROR_CODE.INTERNAL_ERROR);
  }

  const data = (await response.json()) as TurnstileSiteverifyResponse;
  if (!data.success) {
    throw AppError.badRequest('人机验证失败，请重试', API_ERROR_CODE.TURNSTILE_VERIFICATION_FAILED);
  }
}
