import {
  formatUserProfileForPrompt,
  parseUserProfileData,
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

  it('丢掉未知键（含旧 nickname），空值保留', () => {
    expect(
      parseUserProfileData({
        nickname: '阿Tom',
        communication_style: '',
        avoid_topics: ['前任', ''],
        occupation: '工程师',
      }),
    ).toEqual({ communication_style: '', avoid_topics: ['前任', ''] });
  });
});

describe('formatUserProfileForPrompt', () => {
  it('始终注入账号展示名，不采用库里的 nickname', () => {
    expect(formatUserProfileForPrompt({}, 'Tom')).toBe('display_name: Tom');
    expect(formatUserProfileForPrompt({ nickname: '阿Tom' }, 'Tom')).toBe('display_name: Tom');
  });

  it('对象转 YAML', () => {
    expect(
      formatUserProfileForPrompt(
        {
          communication_style: '短句，别说教',
          avoid_topics: ['前任', '家庭矛盾'],
        },
        'Tom',
      ),
    ).toBe(
      [
        'display_name: Tom',
        'communication_style: 短句，别说教',
        'avoid_topics:',
        '  - 前任',
        '  - 家庭矛盾',
      ].join('\n'),
    );
  });
});
