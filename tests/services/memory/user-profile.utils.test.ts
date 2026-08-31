import {
  formatUserProfileForPrompt,
  parseUserProfileData,
  profileLlmOutputSchema,
  snapshotFromLlmOutput,
} from '@/services/memory/user-profile.utils';
import { describe, expect, it } from 'vitest';

describe('parseUserProfileData', () => {
  it('校验失败为 {}', () => {
    expect(parseUserProfileData(null)).toEqual({});
    expect(parseUserProfileData(undefined)).toEqual({});
    expect(parseUserProfileData([])).toEqual({});
    expect(parseUserProfileData('Tom')).toEqual({});
    expect(parseUserProfileData({ communication_style: 1 })).toEqual({});
  });

  it('丢掉未知键，空值保留', () => {
    expect(
      parseUserProfileData({
        extra: '阿Tom',
        communication_style: '',
        avoid_topics: ['前任', ''],
        now: '在做一款 App，上线前有点慌',
        occupation: '工程师',
      }),
    ).toEqual({
      communication_style: '',
      avoid_topics: ['前任', ''],
      now: '在做一款 App，上线前有点慌',
    });
  });
});

describe('formatUserProfileForPrompt', () => {
  it('始终注入账号昵称', () => {
    expect(formatUserProfileForPrompt({}, 'Tom')).toBe('nickname: Tom');
    expect(formatUserProfileForPrompt({ extra: '阿Tom' }, 'Tom')).toBe('nickname: Tom');
  });

  it('对象转 YAML', () => {
    expect(
      formatUserProfileForPrompt(
        {
          communication_style: '短句，别说教',
          avoid_topics: ['前任', '家庭矛盾'],
          now: '在做一款 App，上线前有点慌',
        },
        'Tom',
      ),
    ).toBe(
      [
        'nickname: Tom',
        'communication_style: 短句，别说教',
        'avoid_topics:',
        '  - 前任',
        '  - 家庭矛盾',
        'now: 在做一款 App，上线前有点慌',
      ].join('\n'),
    );
  });
});

describe('profileLlmOutputSchema', () => {
  it('缺 avoid_topics 失败', () => {
    expect(profileLlmOutputSchema.safeParse({ now: '在做 App' }).success).toBe(false);
  });

  it('avoid_topics 必须是数组', () => {
    expect(profileLlmOutputSchema.safeParse({ avoid_topics: '前任' }).success).toBe(false);
    expect(profileLlmOutputSchema.safeParse({ avoid_topics: [] }).success).toBe(true);
  });
});

describe('snapshotFromLlmOutput', () => {
  it('空数组省略 avoid_topics', () => {
    expect(snapshotFromLlmOutput({
      communication_style: '短句',
      avoid_topics: [],
    })).toEqual({ communication_style: '短句' });
  });

  it('非空数组保留', () => {
    expect(snapshotFromLlmOutput({
      avoid_topics: ['政治', '前任'],
      now: '在做 App',
    })).toEqual({
      avoid_topics: ['政治', '前任'],
      now: '在做 App',
    });
  });
});
