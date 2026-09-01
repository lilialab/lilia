import { jsonToYaml } from '@/utils/json-yaml';
import { z } from 'zod';

/** 用户画像闭集：每轮注入，只收束怎么回；不是生平。称呼用账号 nickname，不进画像。 */
export const profileSnapshotSchema = z.object({
  communication_style: z.string().optional().describe(
    'How they prefer you to talk, in one sentence.',
  ),
  avoid_topics: z.array(z.string()).optional().describe('Topics to avoid; one short name each.'),
  now: z.string().optional().describe(
    'What is going on for them right now, in one or two sentences.',
  ),
});

/** LLM 结构化输出：avoid_topics 必为数组，禁止省略该键。 */
export const profileLlmOutputSchema = z.object({
  communication_style: z.string().optional().describe(
    'How they prefer you to talk, in one sentence.',
  ),
  avoid_topics: z.array(z.string()).describe(
    'Topics to avoid; one short name each. Use [] if none.',
  ),
  now: z.string().optional().describe(
    'What is going on for them right now, in one or two sentences.',
  ),
});

export type ProfileSnapshot = z.infer<typeof profileSnapshotSchema>;
export type ProfileLlmOutput = z.infer<typeof profileLlmOutputSchema>;

/** 按 schema 解析；未知键丢弃，校验失败为 {}。 */
export function parseUserProfileData(value: unknown): ProfileSnapshot {
  const parsed = profileSnapshotSchema.safeParse(value);
  return parsed.success ? parsed.data : {};
}

/** LLM 输出转库存形状：空 avoid_topics 省略该键。 */
export function snapshotFromLlmOutput(output: ProfileLlmOutput): ProfileSnapshot {
  return parseUserProfileData({
    communication_style: output.communication_style,
    avoid_topics: output.avoid_topics.length > 0 ? output.avoid_topics : undefined,
    now: output.now,
  });
}

/** 聊天注入：账号昵称 + 画像（称呼不入库）。 */
export function formatUserProfileForPrompt(data: unknown, nickname: string): string {
  return jsonToYaml({
    nickname,
    ...parseUserProfileData(data),
  });
}
