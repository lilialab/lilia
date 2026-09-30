import {
  collectSpokenSlugsSinceLastUser,
  extractLatestContextTextForRag,
  stripLeadingSpeakerLabels,
  withGroupSpeakerLabelsForModel,
} from '@/services/group/message.utils';
import { describe, expect, it } from 'vitest';

describe('stripLeadingSpeakerLabels', () => {
  it('去掉开头一层或多层 (slug):', () => {
    expect(stripLeadingSpeakerLabels('(einstein): 你好')).toBe('你好');
    expect(stripLeadingSpeakerLabels('(einstein): (lilia): hi')).toBe('hi');
  });

  it('无前缀时原样返回', () => {
    expect(stripLeadingSpeakerLabels('普通正文')).toBe('普通正文');
  });
});

describe('withGroupSpeakerLabelsForModel', () => {
  it('仅给助手消息加 (slug): 前缀', () => {
    const labeled = withGroupSpeakerLabelsForModel([
      { id: 'u1', role: 'user', parts: [{ type: 'text', text: '问' }] },
      {
        id: 'a1',
        role: 'assistant',
        parts: [{ type: 'text', text: '答' }],
        metadata: { kind: null, slug: 'einstein' },
      },
    ]);

    expect(labeled[0]?.parts).toEqual([{ type: 'text', text: '问' }]);
    expect(labeled[1]?.parts).toEqual([{ type: 'text', text: '(einstein): 答' }]);
  });

  it('缺 slug 时用 assistant', () => {
    const labeled = withGroupSpeakerLabelsForModel([
      {
        id: 'a1',
        role: 'assistant',
        parts: [{ type: 'text', text: '答' }],
      },
    ]);
    expect(labeled[0]?.parts).toEqual([{ type: 'text', text: '(assistant): 答' }]);
  });
});

describe('extractLatestContextTextForRag', () => {
  it('取最后一条正文', () => {
    expect(
      extractLatestContextTextForRag([
        { id: 'u1', role: 'user', parts: [{ type: 'text', text: '用户' }] },
        {
          id: 'a1',
          role: 'assistant',
          parts: [{ type: 'text', text: '助手' }],
          metadata: { kind: null, slug: 'einstein' },
        },
      ]),
    ).toBe('助手');
  });

  it('空列表返回空串', () => {
    expect(extractLatestContextTextForRag([])).toBe('');
  });
});

describe('collectSpokenSlugsSinceLastUser', () => {
  const user = { id: 'u1', role: 'user' as const, parts: [{ type: 'text' as const, text: '问' }] };
  const assistant = (slug?: string) => ({
    id: `a-${slug ?? 'none'}`,
    role: 'assistant' as const,
    parts: [{ type: 'text' as const, text: '答' }],
    metadata: { kind: null, slug: slug ?? null },
  });

  it('只取最后一条用户消息之后发言的成员，去重且保序', () => {
    expect(
      collectSpokenSlugsSinceLastUser([
        assistant('einstein'),
        user,
        assistant('rin'),
        assistant('lilia'),
        assistant('rin'),
      ]),
    ).toEqual(['rin', 'lilia']);
  });

  it('没有用户消息时从头算；无 slug 的助手消息跳过', () => {
    expect(collectSpokenSlugsSinceLastUser([assistant(), assistant('rin')])).toEqual(['rin']);
  });

  it('空列表返回空数组', () => {
    expect(collectSpokenSlugsSinceLastUser([])).toEqual([]);
  });
});
