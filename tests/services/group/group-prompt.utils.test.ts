import { formatGroupRosterBlock } from '@/services/group/group-prompt.utils';
import { describe, expect, it } from 'vitest';

describe('formatGroupRosterBlock', () => {
  it('含人类用户与成员；当前发言标你；有 shortBio 则写出', () => {
    const block = formatGroupRosterBlock({
      userDisplayName: '小明',
      currentSlug: 'bob',
      members: [
        { slug: 'arbor', displayName: '阿尔博', shortBio: '助理' },
        { slug: 'bob', displayName: '鲍勃', shortBio: '占位' },
      ],
    });

    expect(block).toContain('<group_roster>');
    expect(block).toContain('人类用户：小明（非 AI，无 slug，不可用 @slug 召唤）');
    expect(block).toContain('你（本轮发言）；鲍勃（slug：bob）；简介：占位');
    expect(block).toContain('阿尔博（slug：arbor）；简介：助理');
    expect(block).not.toContain('你（本轮发言）；阿尔博');
  });

  it('缺 shortBio 时不写简介段', () => {
    const block = formatGroupRosterBlock({
      userDisplayName: '用户',
      currentSlug: 'arbor',
      members: [{ slug: 'arbor', displayName: '阿尔博', shortBio: undefined }],
    });

    expect(block).toContain('你（本轮发言）；阿尔博（slug：arbor）');
    expect(block).not.toContain('简介');
  });
});
