import { AppError } from '@/lib/server/app-error';
import { env } from '@/lib/server/env';
import { logger } from '@/lib/server/logger';
import { API_ERROR_CODE } from '@/types/api-error';

const TURNSTILE_SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

type TurnstileSiteverifyResponse = {
  success: boolean;
  action?: string;
  'error-codes'?: string[];
};

type VerifyTurnstileOptions = {
  /** 期望的 `action`；只用于告警，不作为拒绝依据（Cloudflare 不保证回显我们传的值） */
  expectedAction?: string;
};

/**
 * 向 Cloudflare 校验 Turnstile token；失败抛 400。
 *
 * 刻意只认 `success`：`remoteip` 不传（值不保证是合法 IP，传错会整体判失败），`action` 不比对
 * （Cloudflare 不保证回显，官方测试响应里是 `"test"`）。两者都只记日志，便于排查。
 */
export async function verifyTurnstileToken(
  token: string,
  { expectedAction }: VerifyTurnstileOptions = {},
): Promise<void> {
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
    logger.error({ event: 'turnstile.verify.error' }, 'siteverify 请求失败');
    throw AppError.internal('人机验证服务暂不可用', API_ERROR_CODE.INTERNAL_ERROR);
  }

  if (!response.ok) {
    logger.error(
      { event: 'turnstile.verify.error', status: response.status },
      'siteverify 返回非 2xx',
    );
    throw AppError.internal('人机验证服务暂不可用', API_ERROR_CODE.INTERNAL_ERROR);
  }

  const data = (await response.json()) as TurnstileSiteverifyResponse;

  if (!data.success) {
    logger.warn(
      {
        event: 'turnstile.verify.failed',
        errorCodes: data['error-codes'],
        action: data.action,
        expectedAction,
      },
      '人机验证未通过',
    );
    throw AppError.badRequest('人机验证失败，请重试', API_ERROR_CODE.TURNSTILE_VERIFICATION_FAILED);
  }

  if (expectedAction && data.action !== expectedAction) {
    logger.warn(
      { event: 'turnstile.action.mismatch', action: data.action, expectedAction },
      'Turnstile action 与预期不一致',
    );
  }
}
