import { jsonToYaml } from '@/utils/json-yaml';
import { z } from 'zod';

/** 用户画像闭集：只锁怎么回，不是生平。称呼用账号 displayName，不进画像。 */
export const profileSnapshotSchema = z.object({
  communication_style: z.string().optional(),
  avoid_topics: z.array(z.string()).optional(),
});

export type ProfileSnapshot = z.infer<typeof profileSnapshotSchema>;

/** 按 schema 解析；未知键丢弃，校验失败为 {}。 */
export function parseUserProfileData(value: unknown): ProfileSnapshot {
  const parsed = profileSnapshotSchema.safeParse(value);
  return parsed.success ? parsed.data : {};
}

/** 聊天注入：账号展示名 + 画像（称呼不入库）。 */
export function formatUserProfileForPrompt(data: unknown, displayName: string): string {
  return jsonToYaml({
    display_name: displayName,
    ...parseUserProfileData(data),
  });
}
