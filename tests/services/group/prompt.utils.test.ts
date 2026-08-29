import { formatGroupRoster } from '@/services/group/prompt.utils';
import { describe, expect, it } from 'vitest';

describe('formatGroupRoster', () => {
  it('含人类用户与成员 slug；当前发言标你；不含外层标签', () => {
    const body = formatGroupRoster({
      userNickname: '小明',
      currentSlug: 'einstein',
      memberSlugs: ['lilia', 'einstein'],
    });

    expect(body).toContain('人类用户：小明（非 AI，无 slug，不可用 @slug 召唤）');
    expect(body).toContain('你（本轮发言）；einstein');
    expect(body).toContain('- lilia');
    expect(body).not.toContain('你（本轮发言）；lilia');
    expect(body).not.toContain('<group_roster>');
    expect(body).not.toContain('简介');
  });
});
