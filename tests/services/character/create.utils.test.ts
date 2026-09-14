import { buildCreateCharacterProfile } from '@/services/character/create.utils';
import { describe, expect, it } from 'vitest';

describe('buildCreateCharacterProfile', () => {
  it('必填性别写入 identity，空选填不写', () => {
    expect(
      buildCreateCharacterProfile({
        gender: 'female',
        height: undefined,
        relation: undefined,
        personality: undefined,
      }),
    ).toEqual({
      identity: { name: '{{name}}', gender: 'female' },
    });
  });

  it('有填的项才写入', () => {
    expect(
      buildCreateCharacterProfile({
        gender: 'female',
        height: undefined,
        relation: '朋友',
        personality: ['话短', '口语'],
      }),
    ).toEqual({
      identity: { name: '{{name}}', gender: 'female', relation: '朋友' },
      personality: ['话短', '口语'],
    });
  });

  it('空 personality 数组不写入', () => {
    expect(
      buildCreateCharacterProfile({
        gender: 'female',
        height: undefined,
        relation: undefined,
        personality: [],
      }),
    ).toEqual({
      identity: { name: '{{name}}', gender: 'female' },
    });
  });
});
