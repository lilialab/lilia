'use client';

import { fetchChatDailyTurnUsage } from '@/client-api/chat';
import { useTranslations } from '@/components/I18nProvider';
import { cn } from '@/lib/client/cn';
import { queryKeys } from '@/lib/client/query-keys';
import { secondsUntilNextUtcMidnight } from '@/utils/utc-day';
import { useQuery } from '@tanstack/react-query';
import { getStaminaStatus, type StaminaState } from './MeStaminaCard.utils';

/** 只有剩余量报状态：正常绿、低量橙、用尽红；标题与上限保持固定灰。 */
const REMAINING_CLASS: Record<StaminaState, string> = {
  normal: 'text-success',
  low: 'text-warning',
  empty: 'text-destructive',
};

/** 今日体力：`今日体力 剩余/上限` + 倒着走的无极进度条 + 恢复倒计时。加载中或读失败不占位。 */
export function MeStaminaCard() {
  const t = useTranslations('me');
  const { data: usage } = useQuery({
    queryKey: queryKeys.chatQuota,
    queryFn: fetchChatDailyTurnUsage,
    retry: false,
    meta: { showErrorToast: false },
  });

  if (!usage) return null;

  const { percent, state } = getStaminaStatus(usage.remaining, usage.limit);
  const exhausted = state === 'empty';
  const hoursUntilReset = Math.ceil(secondsUntilNextUtcMidnight(new Date()) / 3600);

  return (
    <section className={cn('mt-3 bg-background px-4 py-4')}>
      <div className={cn('flex items-baseline gap-2 text-sm')}>
        <span className={cn('text-muted-foreground')}>{t('staminaTitle')}</span>
        <span>
          <span className={cn(REMAINING_CLASS[state])}>{usage.remaining}</span>
          <span className={cn('text-muted-foreground')}>/{usage.limit}</span>
        </span>
      </div>

      {/* 用尽时条已空，红落在空槽底色上 */}
      <div
        className={cn(
          'mt-2 h-1.5 w-full overflow-hidden rounded-full',
          exhausted ? 'bg-destructive/15' : 'bg-border',
        )}
      >
        {!exhausted && (
          <div
            className={cn('h-full rounded-full', state === 'low' ? 'bg-warning' : 'bg-success')}
            style={{ width: `${percent}%` }}
          />
        )}
      </div>

      <p className={cn('mt-2 text-xs text-muted-foreground')}>
        {t('staminaResetsIn', { hours: hoursUntilReset })}
      </p>
    </section>
  );
}
