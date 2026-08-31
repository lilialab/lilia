import { buildMockExtractTranscript } from '@/services/debug/extract-mock.utils';
import { describe, expect, it } from 'vitest';

describe('buildMockExtractTranscript', () => {
  it('assistant 换成角色 slug，id 为 m0 起，带 local_time', () => {
    const { transcript, messageIds } = buildMockExtractTranscript(
      [
        { speaker: 'user', text: 'a' },
        { speaker: 'assistant', text: 'b' },
      ],
      'lilia',
      'Asia/Shanghai',
    );
    expect(messageIds).toEqual(['m0', 'm1']);
    expect(transcript).toContain('speaker="user"');
    expect(transcript).toContain('speaker="lilia"');
    expect(transcript).not.toContain('speaker="assistant"');
    expect(transcript).toContain('local_time="2026-08-31 20:00:00"');
    expect(transcript).toContain('local_time="2026-08-31 20:01:00"');
  });

  it('跳过空正文', () => {
    const { messageIds } = buildMockExtractTranscript(
      [
        { speaker: 'user', text: '  ' },
        { speaker: 'user', text: 'ok' },
      ],
      'lilia',
      'Asia/Shanghai',
    );
    expect(messageIds).toEqual(['m0']);
  });
});
