import { formatGroupRoster } from '@/services/group/prompt.utils';
import { describe, expect, it } from 'vitest';

describe('formatGroupRoster', () => {
  it('含人类用户与成员 slug；当前发言标你；不含外层标签', () => {
    const body = formatGroupRoster({
      userNickname: '小明',
      currentSlug: 'einstein',
      memberSlugs: ['lilia', 'einstein'],
    });

    expect(body).toContain('Human: 小明 (not an AI)');
    expect(body).toContain('- @einstein (you, speaking this turn)');
    expect(body).toContain('- @lilia');
    expect(body).not.toContain('@lilia (you, speaking this turn)');
    expect(body).not.toContain('<group_roster>');
    expect(body).not.toContain('简介');
  });
});
