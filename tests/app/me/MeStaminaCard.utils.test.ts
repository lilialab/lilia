import { getStaminaStatus } from '@/app/(main)/me/MeStaminaCard.utils';
import { describe, expect, it } from 'vitest';

describe('getStaminaStatus', () => {
  it('剩余充足时为 normal，宽度按占比取整', () => {
    expect(getStaminaStatus(63, 100)).toEqual({ percent: 63, state: 'normal' });
  });

  it('剩余不足 30% 才算低量，正好 30% 仍算正常', () => {
    expect(getStaminaStatus(30, 100).state).toBe('normal');
    expect(getStaminaStatus(29, 100).state).toBe('low');
  });

  it('剩余 0 时用尽，宽度为 0', () => {
    expect(getStaminaStatus(0, 100)).toEqual({ percent: 0, state: 'empty' });
  });

  it('上限非 10 的倍数时按比例算', () => {
    expect(getStaminaStatus(3, 7)).toEqual({ percent: 43, state: 'normal' });
    expect(getStaminaStatus(2, 7)).toEqual({ percent: 29, state: 'low' });
  });
});
