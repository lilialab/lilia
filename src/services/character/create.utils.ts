import { type JsonObject } from '@/utils/json-yaml';

export interface CreateCharacterProfileInput {
  gender: string;
  age: string | undefined;
  height: string | undefined;
  occupation: string | undefined;
  relation: string | undefined;
  attitude: string | undefined;
  personality: string[] | undefined;
  values: string[] | undefined;
  dislikes: string[] | undefined;
}

/** 组装人设 JSON：identity.name 固定占位；空选填不写入。 */
export function buildCreateCharacterProfile(input: CreateCharacterProfileInput): JsonObject {
  const identity: Record<string, string> = { name: '{{name}}', gender: input.gender };
  if (input.age) identity.age = input.age;
  if (input.height) identity.height = input.height;
  if (input.occupation) identity.occupation = input.occupation;
  if (input.relation) identity.relation = input.relation;

  const profile: JsonObject = { identity };
  if (input.attitude) profile.attitude = input.attitude;
  if (input.personality && input.personality.length > 0) {
    profile.personality = input.personality;
  }
  if (input.values && input.values.length > 0) profile.values = input.values;
  if (input.dislikes && input.dislikes.length > 0) profile.dislikes = input.dislikes;
  return profile;
}

/** 第一层 key：next 有则覆盖，没有则保留 existing。 */
export function mergeCharacterProfile(existing: unknown, next: JsonObject): JsonObject {
  if (existing === null || typeof existing !== 'object' || Array.isArray(existing)) {
    return next;
  }
  return { ...existing as JsonObject, ...next };
}
