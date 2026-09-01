import {
  buildProfileRefreshPrompt,
  buildProfileSystemPrompt,
} from '@/services/memory/user-profile.service';
import { describe, expect, it } from 'vitest';

describe('buildProfileRefreshPrompt', () => {
  it('includes existing profile and reference memories', () => {
    const prompt = buildProfileRefreshPrompt({
      existing: { communication_style: '短句，别说教' },
      referenceMemories: [
        { text: '用户每周跑步三次', type: 'fact', confidence: 0.9 },
      ],
    });

    expect(prompt).toContain('Current profile');
    expect(prompt).toContain('"communication_style": "短句，别说教"');
    expect(prompt).toContain('用户每周跑步三次');
    expect(prompt).toContain('Reference memories');
    expect(prompt).not.toContain('【记忆库统计】');
  });

  it('handles empty profile and reference memories', () => {
    const prompt = buildProfileRefreshPrompt({
      existing: {},
      referenceMemories: [],
    });

    expect(prompt).toContain('{}');
    expect(prompt).toContain('Current profile');
    expect(prompt).toContain('Reference memories');
    expect(prompt).toContain('None.');
  });
});

describe('buildProfileSystemPrompt', () => {
  it('无角色 overlay 时只拼全局规则', () => {
    const prompt = buildProfileSystemPrompt('nonexistent');
    expect(prompt).toContain('<user_profile_rules>');
    expect(prompt).not.toContain('character_user_profile_focus');
  });
});
