import { readJobPrompt, readPromptFile } from '@/prompts/load';
import { describe, expect, it } from 'vitest';

describe('prompts/load', () => {
  it('共享 prompt 文件可读', () => {
    expect(readPromptFile('reply-rules.md').length).toBeGreaterThan(0);
    expect(readPromptFile('group-chat-rules.md').length).toBeGreaterThan(0);
    expect(readPromptFile('jobs', 'extract.md').length).toBeGreaterThan(0);
    expect(readJobPrompt('maintain').length).toBeGreaterThan(0);
    expect(readJobPrompt('user-profile').length).toBeGreaterThan(0);
  });

  it('readJobPrompt 未知 id 抛错', () => {
    expect(() => readJobPrompt('unknown' as never)).toThrow(/未知 job prompt/);
  });
});
