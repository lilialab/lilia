import { AppError } from '@/lib/server/app-error';
import { getRedisConnection } from '@/lib/server/redis';
import { GENERATION_LOCK_STALE_MS } from '@/services/session/generation-lock.utils';
import { API_ERROR_CODE } from '@/types/api-error';

function guestGenerationKey(guestId: string, characterId: string): string {
  return `guest-gen:${guestId}:${characterId}`;
}

/**
 * 抢占试聊生成锁（Redis）；失败抛 409。
 * @returns 本次占用时间戳毫秒，释放时须原样传入
 */
export async function claimGuestGeneration(
  guestId: string,
  characterId: string,
): Promise<number> {
  const redis = getRedisConnection();
  const key = guestGenerationKey(guestId, characterId);
  const now = Date.now();
  const existing = await redis.get(key);
  if (existing) {
    const startedAt = Number(existing);
    if (Number.isFinite(startedAt) && now - startedAt < GENERATION_LOCK_STALE_MS) {
      throw AppError.conflict('对方正在回复，请稍后再发', API_ERROR_CODE.GENERATION_BUSY);
    }
  }
  await redis.set(key, String(now), 'EX', Math.ceil(GENERATION_LOCK_STALE_MS / 1000));
  return now;
}

/** 释放试聊生成锁（仅当占用时间仍匹配时）。 */
export async function releaseGuestGeneration(
  guestId: string,
  characterId: string,
  claimedAt: number,
): Promise<void> {
  const redis = getRedisConnection();
  const key = guestGenerationKey(guestId, characterId);
  const existing = await redis.get(key);
  if (existing === String(claimedAt)) {
    await redis.del(key);
  }
}
