import { formatGroupRoster, ROSTER_SHORT_BIO_MAX_LENGTH } from '@/services/group/prompt.utils';
import { describe, expect, it } from 'vitest';

const members = [
  { slug: 'lilia', name: '莉莉娅', shortBio: '温柔的女仆，说话轻声' },
  { slug: 'einstein', name: '爱因斯坦', shortBio: '物理学家，喜欢先反问' },
];

describe('formatGroupRoster', () => {
  it('人类带 handle、成员带展示名与简介；当前发言标你；不含外层标签', () => {
    const body = formatGroupRoster({
      userNickname: '小明',
      currentSlug: 'einstein',
      members,
      spokenSlugs: [],
    });

    expect(body).toContain('- @小明 (the human, not an AI)');
    expect(body).toContain('- @einstein 爱因斯坦 (you, speaking this turn) — 物理学家，喜欢先反问');
    expect(body).toContain('- @lilia 莉莉娅 — 温柔的女仆，说话轻声');
    expect(body).not.toContain('@lilia 莉莉娅 (you, speaking this turn)');
    expect(body).not.toContain('<group_roster>');
  });

  it('标出本轮已发过言的成员（当前发言者优先，不重复标）', () => {
    const body = formatGroupRoster({
      userNickname: '小明',
      currentSlug: 'einstein',
      members,
      spokenSlugs: ['lilia', 'einstein'],
    });

    expect(body).toContain('- @lilia 莉莉娅 (spoke already this round) — 温柔的女仆，说话轻声');
    expect(body).toContain('- @einstein 爱因斯坦 (you, speaking this turn) — 物理学家，喜欢先反问');
    expect(body).not.toContain('(spoke already this round) (you, speaking this turn)');
  });

  it('空简介不留悬空破折号；超长简介截断', () => {
    const body = formatGroupRoster({
      userNickname: '小明',
      currentSlug: 'lilia',
      members: [
        { slug: 'lilia', name: '莉莉娅', shortBio: '   ' },
        {
          slug: 'einstein',
          name: '爱因斯坦',
          shortBio: '物'.repeat(ROSTER_SHORT_BIO_MAX_LENGTH + 5),
        },
      ],
      spokenSlugs: [],
    });

    expect(body).toContain('- @lilia 莉莉娅 (you, speaking this turn)');
    expect(body).not.toContain('(you, speaking this turn) —');
    expect(body).toContain(`— ${'物'.repeat(ROSTER_SHORT_BIO_MAX_LENGTH)}…`);
    expect(body).not.toContain('物'.repeat(ROSTER_SHORT_BIO_MAX_LENGTH + 1));
  });
});
