import { jsonToYaml, yamlToJson } from '@/utils/json-yaml';
import { describe, expect, it } from 'vitest';

describe('jsonToYaml', () => {
  it('空对象与空容器省略', () => {
    expect(jsonToYaml({})).toBe('');
    expect(jsonToYaml({ a: 1, b: {}, c: [], d: { e: [] } })).toBe('a: 1');
    expect(jsonToYaml(null)).toBe('');
  });

  it('两层对象与字符串列表', () => {
    expect(
      jsonToYaml({
        identity: {
          name: '{{name}}',
          age: 15,
          gender: 'female',
          height: '147cm',
          relation: '最好的朋友',
        },
        interests: {
          hobbies: ['reading'],
        },
      }),
    ).toBe(
      [
        'identity:',
        '  name: "{{name}}"',
        '  age: 15',
        '  gender: female',
        '  height: 147cm',
        '  relation: 最好的朋友',
        'interests:',
        '  hobbies:',
        '    - reading',
      ].join('\n'),
    );
  });

  it('布尔与需加引号的字符串', () => {
    expect(jsonToYaml({ ok: true, flag: false, look: 'true', num: '15' })).toBe(
      ['ok: true', 'flag: false', 'look: "true"', 'num: "15"'].join('\n'),
    );
  });

  it('对象数组', () => {
    expect(jsonToYaml({ friends: [{ name: 'a', age: 1 }, { name: 'b' }] })).toBe(
      ['friends:', '  - name: a', '    age: 1', '  - name: b'].join('\n'),
    );
  });
});

describe('yamlToJson', () => {
  it('空文本为空对象', () => {
    expect(yamlToJson('')).toEqual({});
    expect(yamlToJson('  \n')).toEqual({});
  });

  it('与 jsonToYaml 往返', () => {
    const samples = [
      { a: 1, b: 'x' },
      {
        identity: {
          name: '{{name}}',
          age: 15,
          gender: 'female',
          height: '147cm',
          relation: '最好的朋友',
        },
        interests: { hobbies: ['reading'] },
      },
      { ok: true, flag: false, look: 'true', num: '15' },
      { friends: [{ name: 'a', age: 1 }, { name: 'b' }] },
    ];
    for (const sample of samples) {
      expect(yamlToJson(jsonToYaml(sample))).toEqual(sample);
    }
  });
});
