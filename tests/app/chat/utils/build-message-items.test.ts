import { buildMessageItems } from '@/app/chat/utils/build-message-items';
import type { HistoryMessage } from '@/lib/client/api/sessions';
import { describe, expect, it } from 'vitest';

function makeMessage(id: string, createdAt: string): HistoryMessage {
  return {
    id,
    role: 'user',
    parts: [{ type: 'text', text: 'hello' }],
    createdAt,
  };
}

describe('buildMessageItems', () => {
  it('returns empty array for no messages', () => {
    expect(buildMessageItems([])).toEqual([]);
  });

  it('inserts one divider for two messages on the same day', () => {
    const items = buildMessageItems([
      makeMessage('a', '2024-06-01T10:00:00.000Z'),
      makeMessage('b', '2024-06-01T15:00:00.000Z'),
    ]);

    expect(items).toHaveLength(3);
    expect(items[0]).toMatchObject({ type: 'divider', key: 'divider-2024-06-01' });
    expect(items[1]).toMatchObject({ type: 'message', message: { id: 'a' } });
    expect(items[2]).toMatchObject({ type: 'message', message: { id: 'b' } });
  });

  it('inserts dividers when messages span two days', () => {
    const items = buildMessageItems([
      makeMessage('a', '2024-06-01T10:00:00.000Z'),
      makeMessage('b', '2024-06-02T10:00:00.000Z'),
    ]);

    expect(items).toHaveLength(4);
    expect(items[0]).toMatchObject({ type: 'divider', key: 'divider-2024-06-01' });
    expect(items[1]).toMatchObject({ type: 'message', message: { id: 'a' } });
    expect(items[2]).toMatchObject({ type: 'divider', key: 'divider-2024-06-02' });
    expect(items[3]).toMatchObject({ type: 'message', message: { id: 'b' } });
  });

  it('uses yyyy-MM-dd divider label for historical dates', () => {
    const items = buildMessageItems([makeMessage('a', '2024-06-01T10:00:00.000Z')]);

    expect(items[0]).toMatchObject({
      type: 'divider',
      label: '2024年6月1日',
    });
  });
});
