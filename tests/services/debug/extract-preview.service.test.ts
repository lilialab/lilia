import { listExtractFixtures } from '@/services/debug/extract-preview.service';
import { describe, expect, it } from 'vitest';

describe('listExtractFixtures', () => {
  it('含 boundary 夹具且消息非空', () => {
    const fixtures = listExtractFixtures();
    const boundary = fixtures.find((fixture) => fixture.id === 'boundary');
    expect(boundary).toBeDefined();
    expect(boundary?.messages.length).toBeGreaterThan(0);
    expect(boundary?.messages.every((message) => message.speaker && message.text)).toBe(true);
  });
});
