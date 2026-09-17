import { AppError } from '@/lib/server/app-error';
import { verifyTurnstileToken } from '@/lib/server/turnstile';
import {
  assertGuestTrialCredential,
  createGuestTrialToken,
  type GuestTrialCredential,
  newGuestTrialId,
  parseGuestTrialToken,
} from '@/services/guest/trial-cookie';
import { API_ERROR_CODE } from '@/types/api-error';
import { formatUtcDate } from '@/utils/utc-day';

export type IssueGuestTrialResult = {
  credential: GuestTrialCredential;
  token: string;
  /** 是否新验了 Turnstile（复用当日 cookie 时为 false） */
  turnstileUsed: boolean;
};

/**
 * 签发或复用当日访客试聊凭证。
 * 已有今日有效 cookie 时直接复用，不必再过 Turnstile；否则必须提供 turnstileToken。
 */
export async function issueGuestTrialCredential(input: {
  existingToken: string | null;
  turnstileToken: string | undefined;
  now?: Date;
}): Promise<IssueGuestTrialResult> {
  const now = input.now ?? new Date();
  const utcDay = formatUtcDate(now);

  if (input.existingToken) {
    const existing = parseGuestTrialToken(input.existingToken);
    if (existing && existing.utcDay === utcDay) {
      return {
        credential: existing,
        token: input.existingToken,
        turnstileUsed: false,
      };
    }
  }

  const turnstileToken = input.turnstileToken?.trim();
  if (!turnstileToken) {
    throw AppError.badRequest('请完成人机验证', API_ERROR_CODE.TURNSTILE_TOKEN_REQUIRED);
  }

  await verifyTurnstileToken(turnstileToken);

  const guestId = newGuestTrialId();
  const token = createGuestTrialToken(guestId, utcDay);
  return {
    credential: { guestId, utcDay },
    token,
    turnstileUsed: true,
  };
}

/** 从 cookie token 解析今日有效凭证。 */
export function resolveGuestTrialCredential(
  token: string | null,
  now = new Date(),
): GuestTrialCredential {
  return assertGuestTrialCredential(token, now);
}
