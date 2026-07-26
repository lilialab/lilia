import {
  DEFAULT_CHARACTER_ID,
  loadCharacter,
  loadExtractPrompt,
  loadJobPrompt,
  loadPlatformSafety,
} from '@/prompts/load';
import { describe, expect, it } from 'vitest';

describe('prompts/load', () => {
  it('默认角色为 arbor', () => {
    expect(DEFAULT_CHARACTER_ID).toBe('arbor');
    const character = loadCharacter();
    expect(character.id).toBe('arbor');
    expect(character.displayName).toBe('阿尔博');
    expect(character.persona).toContain('阿尔博');
    expect(character.skills).toEqual(['searchChatHistory']);
    expect(character.shortBio).toContain('成长型');
  });

  it('可加载占位角色 bob / cindy / dave', () => {
    const bob = loadCharacter('bob');
    expect(bob.id).toBe('bob');
    expect(bob.displayName).toBe('鲍勃');
    expect(bob.persona).toContain('鲍勃');
    expect(bob.skills).toEqual([]);
    expect(bob.shortBio).toBeTruthy();

    const cindy = loadCharacter('cindy');
    expect(cindy.id).toBe('cindy');
    expect(cindy.displayName).toBe('辛迪');
    expect(cindy.skills).toEqual([]);
    expect(cindy.shortBio).toBeTruthy();

    const dave = loadCharacter('dave');
    expect(dave.id).toBe('dave');
    expect(dave.displayName).toBe('戴夫');
    expect(dave.skills).toEqual([]);
    expect(dave.shortBio).toBeTruthy();
  });

  it('loadExtractPrompt(arbor) 含核心规则与弱模型约束', () => {
    const prompt = loadExtractPrompt('arbor');
    expect(prompt.length).toBeGreaterThan(100);
    expect(prompt).toContain('finished_memories');
    expect(prompt).toContain('弱模型额外约束');
    expect(prompt).toContain('阿尔博');
  });

  it('loadExtractPrompt 未知角色 fallback 到全局默认', () => {
    const prompt = loadExtractPrompt('nonexistent');
    expect(prompt.length).toBeGreaterThan(100);
    expect(prompt).toContain('finished_memories');
    expect(prompt).not.toContain('专属提取重点');
  });

  it('loadJobPrompt(maintain|profile) 与平台 safety 非空', () => {
    expect(loadJobPrompt('maintain')).toContain('记忆库维护专家');
    expect(loadJobPrompt('profile')).toContain('用户画像维护专家');
    expect(loadPlatformSafety().length).toBeGreaterThan(20);
  });

  it('loadJobPrompt 未知 id 抛错', () => {
    expect(() => loadJobPrompt('unknown' as never)).toThrow(/未知 job prompt/);
  });
});
