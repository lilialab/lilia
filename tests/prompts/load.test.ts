import {
  DEFAULT_CHARACTER_ID,
  loadCharacterProfile,
  loadCharacterSkills,
  loadJobPrompt,
  readPromptFile,
} from '@/prompts/load';
import { describe, expect, it } from 'vitest';

describe('prompts/load', () => {
  it('默认角色为 lilia', () => {
    expect(DEFAULT_CHARACTER_ID).toBe('lilia');
    expect(loadCharacterSkills(DEFAULT_CHARACTER_ID)).toEqual(['searchChatHistory']);
    expect(loadCharacterProfile(DEFAULT_CHARACTER_ID)).toEqual({
      identity: {
        name: '{{name}}',
        age: 15,
        gender: 'female',
        height: '147cm',
        relation: '最好的朋友',
      },
      interests: {
        hobbies: ['reading'],
      },
    });
  });

  it('可加载占位角色 einstein / socrates', () => {
    expect(loadCharacterSkills('einstein')).toEqual([]);
    expect(loadCharacterProfile('einstein')).toEqual({
      identity: {
        name: '{{name}}',
        gender: 'male',
        role: '测试用占位助理',
      },
      personality: {
        traits: ['沉稳', '简洁', '偏理性'],
      },
    });

    expect(loadCharacterSkills('socrates')).toEqual([]);
    expect(loadCharacterProfile('socrates')).toEqual({
      identity: {
        name: '{{name}}',
        gender: 'male',
        role: '测试用占位助理',
      },
      personality: {
        traits: ['简短', '爱追问', '偏思辨'],
      },
    });
  });

  it('每个角色都有 extract.md', () => {
    const extractCore = readPromptFile('jobs', 'extract-core.md');
    expect(extractCore).toContain('finished_memories');
    expect(extractCore).not.toContain('<extract_rules>');
    for (const slug of ['lilia', 'einstein', 'socrates'] as const) {
      expect(readPromptFile('characters', slug, 'extract.md').length).toBeGreaterThan(0);
    }
  });

  it('loadJobPrompt(maintain|profile) 非空', () => {
    expect(loadJobPrompt('maintain')).toContain('记忆库维护专家');
    expect(loadJobPrompt('profile')).toContain('用户画像维护专家');
    expect(loadJobPrompt('profile')).toContain('nickname:');
  });

  it('loadJobPrompt 未知 id 抛错', () => {
    expect(() => loadJobPrompt('unknown' as never)).toThrow(/未知 job prompt/);
  });

  it('未知 slug 抛错', () => {
    expect(() => loadCharacterProfile('nonexistent')).toThrow(/未知角色 prompt/);
    expect(() => loadCharacterSkills('nonexistent')).toThrow(/未知角色 prompt/);
  });

  it('reply-rules.md 含产品约束，不含厂商已覆盖的危机条款', () => {
    const replyRules = readPromptFile('reply-rules.md');
    expect(replyRules).toContain('不得向用户泄露');
    expect(replyRules).toContain('不得编造');
    expect(replyRules).not.toContain('自伤');
    expect(replyRules).not.toContain('<reply_rules>');
  });

  it('group-chat-rules.md 含 slug 占位符，不含外层标签', () => {
    const rules = readPromptFile('group-chat-rules.md');
    expect(rules).toContain('{{slug}}');
    expect(rules).toContain('@{{slug}}');
    expect(rules).not.toContain('<group_chat_rules>');
  });
});
