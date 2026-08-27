import {
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
