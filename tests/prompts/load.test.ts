import {
  DEFAULT_CHARACTER_ID,
  listCharacterSlugs,
  loadCharacterProfile,
  loadCharacterSkills,
  readCharacterJobPrompt,
  readJobPrompt,
  readPromptFile,
  tryReadCharacterJobPrompt,
} from '@/prompts/load';
import { describe, expect, it } from 'vitest';

describe('prompts/load', () => {
  it('已知角色可加载画像与技能列表', () => {
    const slugs = listCharacterSlugs();
    expect(slugs.length).toBeGreaterThan(0);
    expect(slugs).toContain(DEFAULT_CHARACTER_ID);
    for (const slug of slugs) {
      const profile = loadCharacterProfile(slug);
      expect(profile).toBeTypeOf('object');
      expect(profile).not.toBeNull();
      expect(Array.isArray(profile)).toBe(false);

      const skills = loadCharacterSkills(slug);
      expect(Array.isArray(skills)).toBe(true);
      expect(skills.every((id) => typeof id === 'string')).toBe(true);
    }
  });

  it('已知角色可加载 extract 补充提示', () => {
    for (const slug of listCharacterSlugs()) {
      expect(readCharacterJobPrompt(slug, 'extract').length).toBeGreaterThan(0);
    }
  });

  it('画像角色 overlay 缺失时不抛', () => {
    expect(tryReadCharacterJobPrompt('nonexistent', 'user-profile')).toBeUndefined();
  });

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

  it('未知 slug 抛错', () => {
    expect(() => loadCharacterProfile('nonexistent')).toThrow(/未知角色 prompt/);
    expect(() => loadCharacterSkills('nonexistent')).toThrow(/未知角色 prompt/);
    expect(() => readCharacterJobPrompt('nonexistent', 'extract')).toThrow(/未知角色 prompt/);
  });
});
