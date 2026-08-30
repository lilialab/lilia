import {
  extractSpeaker,
  formatExtractMessageXml,
  isIncludedInGroupExtract,
  mapExtractOutput,
  parseFinishedMemoryItem,
  validateAndMergeIds,
} from '@/services/memory/extract.utils';
import { describe, expect, it } from 'vitest';

const MESSAGE_IDS = ['m0', 'm1', 'm2', 'm3', 'm4'];

describe('isIncludedInGroupExtract', () => {
  it('excludes turn_cue', () => {
    expect(isIncludedInGroupExtract('turn_cue')).toBe(false);
  });

  it('includes null and other kinds', () => {
    expect(isIncludedInGroupExtract(null)).toBe(true);
    expect(isIncludedInGroupExtract(undefined)).toBe(true);
    expect(isIncludedInGroupExtract('other')).toBe(true);
  });
});

describe('extractSpeaker', () => {
  it('labels user as user', () => {
    expect(extractSpeaker('user')).toBe('user');
  });

  it('uses assistant slug when provided', () => {
    expect(extractSpeaker('assistant', 'lilia')).toBe('lilia');
  });

  it('assistant 未指定 slug 时抛错', () => {
    expect(() => extractSpeaker('assistant')).toThrow(/assistant 消息须指定 assistantSlug/);
  });
});

describe('formatExtractMessageXml', () => {
  it('空正文为 null', () => {
    expect(formatExtractMessageXml('m0', 0, 'user', '  ')).toBeNull();
  });

  it('写出 id seq speaker', () => {
    expect(formatExtractMessageXml('m0', 0, 'user', 'hi')).toBe(
      '<message id="m0" seq="0" speaker="user">hi</message>',
    );
  });
});

describe('parseFinishedMemoryItem', () => {
  it('returns object for valid preference with ids', () => {
    const result = parseFinishedMemoryItem({
      text: '用户喜欢跑步',
      type: 'preference',
      source_message_ids: ['m0', 'm1'],
      confidence: 0.9,
    });

    expect(result).toEqual({
      text: '用户喜欢跑步',
      type: 'preference',
      sourceMessageIds: ['m0', 'm1'],
      confidence: 0.9,
    });
  });

  it('returns null for empty text', () => {
    expect(
      parseFinishedMemoryItem({
        text: '   ',
        type: 'fact',
        source_message_ids: ['m0'],
        confidence: 0.8,
      }),
    ).toBeNull();
  });

  it('returns null for invalid type', () => {
    expect(
      parseFinishedMemoryItem({
        text: '用户喜欢跑步',
        type: 'invalid',
        source_message_ids: ['m0'],
        confidence: 0.8,
      }),
    ).toBeNull();
  });

  it('returns null for empty source_message_ids', () => {
    expect(
      parseFinishedMemoryItem({
        text: '用户喜欢跑步',
        type: 'preference',
        source_message_ids: [],
        confidence: 0.8,
      }),
    ).toBeNull();
  });

  it('returns null when confidence is missing', () => {
    expect(
      parseFinishedMemoryItem({
        text: '用户喜欢跑步',
        type: 'preference',
        source_message_ids: ['m0'],
      }),
    ).toBeNull();
  });

  it('returns null when confidence is out of range', () => {
    expect(
      parseFinishedMemoryItem({
        text: '用户喜欢跑步',
        type: 'preference',
        source_message_ids: ['m0'],
        confidence: 1.5,
      }),
    ).toBeNull();
  });
});

describe('mapExtractOutput', () => {
  it('keeps only valid entries', () => {
    const result = mapExtractOutput({
      finished_memories: [
        {
          text: '用户喜欢咖啡',
          type: 'preference',
          source_message_ids: ['m0'],
          confidence: 0.95,
        },
        { text: '', type: 'fact', source_message_ids: ['m1'], confidence: 0.8 },
        {
          text: '用户是工程师',
          type: 'fact',
          source_message_ids: ['m2'],
          confidence: 0.88,
        },
      ],
    });

    expect(result.finishedMemories).toHaveLength(2);
    expect(result.finishedMemories[0].text).toBe('用户喜欢咖啡');
    expect(result.finishedMemories[1].text).toBe('用户是工程师');
  });
});

describe('validateAndMergeIds', () => {
  it('defers all messages when finishedMemories is empty', () => {
    const result = validateAndMergeIds({ finishedMemories: [] }, MESSAGE_IDS);

    expect(result.extractedIds).toEqual([]);
    expect(result.deferredIds).toEqual(MESSAGE_IDS);
  });

  it('marks prefix through globalMax for single memory', () => {
    const result = validateAndMergeIds(
      {
        finishedMemories: [
          {
            text: '用户喜欢跑步',
            type: 'preference',
            sourceMessageIds: ['m0', 'm1'],
            confidence: 0.9,
          },
        ],
      },
      MESSAGE_IDS,
    );

    expect(result.extractedIds).toEqual(['m0', 'm1']);
    expect(result.deferredIds).toEqual(['m2', 'm3', 'm4']);
  });

  it('uses last memory globalMax when multiple memories exist', () => {
    const result = validateAndMergeIds(
      {
        finishedMemories: [
          {
            text: '用户喜欢跑步',
            type: 'preference',
            sourceMessageIds: ['m0', 'm1'],
            confidence: 0.9,
          },
          {
            text: '用户计划下周旅行',
            type: 'event',
            sourceMessageIds: ['m2', 'm3'],
            confidence: 0.85,
          },
        ],
      },
      MESSAGE_IDS,
    );

    expect(result.extractedIds).toEqual(['m0', 'm1', 'm2', 'm3']);
    expect(result.deferredIds).toEqual(['m4']);
  });

  it('drops memory with invalid ids and defers all if none remain', () => {
    const result = validateAndMergeIds(
      {
        finishedMemories: [
          {
            text: '非法记忆',
            type: 'fact',
            sourceMessageIds: ['m0', 'unknown'],
            confidence: 0.8,
          },
        ],
      },
      MESSAGE_IDS,
    );

    expect(result.finishedMemories).toEqual([]);
    expect(result.extractedIds).toEqual([]);
    expect(result.deferredIds).toEqual(MESSAGE_IDS);
    expect(result.droppedInvalidIdTexts).toEqual(['非法记忆']);
  });
});
