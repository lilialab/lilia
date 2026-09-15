import {
  buildCreateCharacterProfile,
  mergeCharacterProfile,
} from '@/services/character/create.utils';
import { describe, expect, it } from 'vitest';

const emptyOptional = {
  age: undefined,
  height: undefined,
  occupation: undefined,
  relation: undefined,
  attitude: undefined,
  personality: undefined,
  values: undefined,
  dislikes: undefined,
};

describe('buildCreateCharacterProfile', () => {
  it('必填性别写入 identity，空选填不写', () => {
    expect(
      buildCreateCharacterProfile({
        gender: 'female',
        ...emptyOptional,
      }),
    ).toEqual({
      identity: { name: '{{name}}', gender: 'female' },
    });
  });

  it('有填的项才写入', () => {
    expect(
      buildCreateCharacterProfile({
        gender: 'female',
        age: '17',
        height: undefined,
        occupation: '学生',
        relation: '朋友',
        attitude: '对人冷淡。',
        personality: ['话短', '口语'],
        values: ['有话直说'],
        dislikes: ['被说教'],
      }),
    ).toEqual({
      identity: {
        name: '{{name}}',
        gender: 'female',
        age: '17',
        occupation: '学生',
        relation: '朋友',
      },
      attitude: '对人冷淡。',
      personality: ['话短', '口语'],
      values: ['有话直说'],
      dislikes: ['被说教'],
    });
  });

  it('空 personality 数组不写入', () => {
    expect(
      buildCreateCharacterProfile({
        gender: 'female',
        ...emptyOptional,
        personality: [],
      }),
    ).toEqual({
      identity: { name: '{{name}}', gender: 'female' },
    });
  });
});

describe('mergeCharacterProfile', () => {
  it('next 有的第一层 key 覆盖，没有的保留', () => {
    expect(
      mergeCharacterProfile(
        {
          identity: { name: '{{name}}', gender: 'female' },
          personality: ['旧'],
          speech: { do: ['只接眼前这句。'] },
        },
        {
          identity: { name: '{{name}}', gender: 'male' },
          personality: ['稳'],
        },
      ),
    ).toEqual({
      identity: { name: '{{name}}', gender: 'male' },
      personality: ['稳'],
      speech: { do: ['只接眼前这句。'] },
    });
  });

  it('existing 非对象时用 next', () => {
    expect(mergeCharacterProfile(null, { identity: { gender: 'female' } })).toEqual({
      identity: { gender: 'female' },
    });
  });
});
