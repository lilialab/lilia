import { listExtractFixtures } from '@/services/debug/extract-preview.service';
import { describe, expect, it } from 'vitest';

describe('listExtractFixtures', () => {
  it('含单聊中文夹具且消息非空', () => {
    const chatZh = listExtractFixtures().find((fixture) => fixture.id === 'chat-zh');
    expect(chatZh).toBeDefined();
    expect(chatZh?.label).toBe('单聊 · 中文');
    expect(chatZh?.messages.length).toBeGreaterThan(0);
    expect(chatZh?.messages.every((message) => message.speaker && message.text)).toBe(true);
  });

  it('含群聊中文夹具，说话人是 slug 而非 assistant', () => {
    const groupZh = listExtractFixtures().find((fixture) => fixture.id === 'group-zh');
    expect(groupZh).toBeDefined();
    expect(groupZh?.label).toBe('群聊 · 中文');
    const speakers = new Set(groupZh?.messages.map((message) => message.speaker));
    expect(speakers.has('user')).toBe(true);
    expect(speakers.has('lilia')).toBe(true);
    expect(speakers.has('rin')).toBe(true);
    expect(speakers.has('assistant')).toBe(false);
  });

  it('含单聊英文夹具且用户句无中文', () => {
    const chatEn = listExtractFixtures().find((fixture) => fixture.id === 'chat-en');
    expect(chatEn).toBeDefined();
    expect(chatEn?.label).toBe('单聊 · 英文');
    expect(chatEn?.timeZone).toBe('America/New_York');
    const userTexts = (chatEn?.messages ?? [])
      .filter((message) => message.speaker === 'user')
      .map((message) => message.text);
    expect(userTexts.length).toBeGreaterThan(0);
    expect(userTexts.every((text) => !/\p{Script=Han}/u.test(text))).toBe(true);
  });
});
