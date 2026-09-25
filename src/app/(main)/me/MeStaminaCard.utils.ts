export type StaminaState = 'normal' | 'low' | 'empty';

/** 剩余占上限低于这个比例算低量（橙）。 */
const LOW_STAMINA_RATIO = 0.3;

export interface StaminaStatus {
  /** 剩余占比 0~100，取整后给进度条宽度。 */
  percent: number;
  state: StaminaState;
}

/** 剩余额度换算成进度条宽度与告警档位：0 用尽（红），不足 30% 低量（橙）。 */
export function getStaminaStatus(remaining: number, limit: number): StaminaStatus {
  if (remaining <= 0) {
    return { percent: 0, state: 'empty' };
  }

  return {
    percent: Math.round((remaining / limit) * 100),
    state: remaining < limit * LOW_STAMINA_RATIO ? 'low' : 'normal',
  };
}
