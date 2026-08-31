import { listExtractFixtures } from '@/services/debug/extract-preview.service';
import { describe, expect, it } from 'vitest';

describe('listExtractFixtures', () => {
  it('含 topic 夹具且消息非空', () => {
    const fixtures = listExtractFixtures();
    const topic = fixtures.find((fixture) => fixture.id === 'topic');
    expect(topic).toBeDefined();
    expect(topic?.messages.length).toBeGreaterThan(0);
    expect(topic?.messages.every((message) => message.speaker && message.text)).toBe(true);
  });
});
