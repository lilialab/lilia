import { buildProfileRefreshPrompt } from '@/services/memory/user-profile.service';
import { describe, expect, it } from 'vitest';

describe('buildProfileRefreshPrompt', () => {
  it('includes existing profile and reference memories', () => {
    const prompt = buildProfileRefreshPrompt({
      existing: { communication_style: '短句，别说教' },
      referenceMemories: [
        { text: '用户每周跑步三次', type: 'preference', confidence: 0.9 },
      ],
    });

    expect(prompt).toContain('【现有画像】');
    expect(prompt).toContain('"communication_style": "短句，别说教"');
    expect(prompt).toContain('用户每周跑步三次');
    expect(prompt).toContain('【参考记忆（高置信度与活跃度优先）】');
    expect(prompt).not.toContain('【记忆库统计】');
  });

  it('handles empty profile and reference memories', () => {
    const prompt = buildProfileRefreshPrompt({
      existing: {},
      referenceMemories: [],
    });

    expect(prompt).toContain('{}');
    expect(prompt).toContain('【现有画像】');
    expect(prompt).toContain('【参考记忆（高置信度与活跃度优先）】');
  });
});
