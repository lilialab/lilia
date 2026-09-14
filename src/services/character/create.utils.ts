import { type JsonObject } from '@/utils/json-yaml';

export interface CreateCharacterProfileInput {
  gender: string;
  height: string | undefined;
  relation: string | undefined;
  personality: string[] | undefined;
}

/** 组装创建用 profile：identity.name 固定占位；空选填不写入。 */
export function buildCreateCharacterProfile(input: CreateCharacterProfileInput): JsonObject {
  const identity: Record<string, string> = { name: '{{name}}', gender: input.gender };
  if (input.height) identity.height = input.height;
  if (input.relation) identity.relation = input.relation;

  const profile: JsonObject = { identity };
  if (input.personality && input.personality.length > 0) {
    profile.personality = input.personality;
  }
  return profile;
}
