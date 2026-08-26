import { formatGroupRosterBlock } from '@/services/group/group-prompt.utils';
import { describe, expect, it } from 'vitest';

describe('formatGroupRosterBlock', () => {
  it('含人类用户与成员 slug；当前发言标你', () => {
    const block = formatGroupRosterBlock({
      userDisplayName: '小明',
      currentSlug: 'bob',
      memberSlugs: ['lilia', 'bob'],
    });

    expect(block).toContain('<group_roster>');
    expect(block).toContain('人类用户：小明（非 AI，无 slug，不可用 @slug 召唤）');
    expect(block).toContain('你（本轮发言）；bob');
    expect(block).toContain('- lilia');
    expect(block).not.toContain('你（本轮发言）；lilia');
    expect(block).not.toContain('简介');
  });
});
