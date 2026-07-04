import { describe, expect, it } from 'vitest';
import {
  mapConsolidationOutput,
  parseFinishedMemoryItem,
  validateAndMergeIds,
} from '@/services/memory-consolidation.utils';

const MESSAGE_IDS = ['m0', 'm1', 'm2', 'm3', 'm4'];

describe('parseFinishedMemoryItem', () => {
  it('returns object for valid preference with ids', () => {
    const result = parseFinishedMemoryItem({
      text: '用户喜欢跑步',
      type: 'preference',
      source_message_ids: ['m0', 'm1'],
    });

    expect(result).toEqual({
      text: '用户喜欢跑步',
      type: 'preference',
      sourceMessageIds: ['m0', 'm1'],
    });
  });

  it('returns null for empty text', () => {
    expect(
      parseFinishedMemoryItem({
        text: '   ',
        type: 'fact',
        source_message_ids: ['m0'],
      }),
    ).toBeNull();
  });

  it('returns null for invalid type', () => {
    expect(
      parseFinishedMemoryItem({
        text: '用户喜欢跑步',
        type: 'invalid',
        source_message_ids: ['m0'],
      }),
    ).toBeNull();
  });

  it('returns null for empty source_message_ids', () => {
    expect(
      parseFinishedMemoryItem({
        text: '用户喜欢跑步',
        type: 'preference',
        source_message_ids: [],
      }),
    ).toBeNull();
  });
});

describe('mapConsolidationOutput', () => {
  it('keeps only valid entries', () => {
    const result = mapConsolidationOutput({
      finished_memories: [
        { text: '用户喜欢咖啡', type: 'preference', source_message_ids: ['m0'] },
        { text: '', type: 'fact', source_message_ids: ['m1'] },
        { text: '用户是工程师', type: 'fact', source_message_ids: ['m2'] },
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

    expect(result.consolidatedIds).toEqual([]);
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
          },
        ],
      },
      MESSAGE_IDS,
    );

    expect(result.consolidatedIds).toEqual(['m0', 'm1']);
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
          },
          {
            text: '用户计划下周旅行',
            type: 'event',
            sourceMessageIds: ['m2', 'm3'],
          },
        ],
      },
      MESSAGE_IDS,
    );

    expect(result.consolidatedIds).toEqual(['m0', 'm1', 'm2', 'm3']);
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
          },
        ],
      },
      MESSAGE_IDS,
    );

    expect(result.finishedMemories).toEqual([]);
    expect(result.consolidatedIds).toEqual([]);
    expect(result.deferredIds).toEqual(MESSAGE_IDS);
    expect(result.droppedInvalidIdTexts).toEqual(['非法记忆']);
  });
});
