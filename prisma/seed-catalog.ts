import type { InputJsonValue } from '@prisma/client/runtime/client';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prisma } from '../src/lib/server/prisma';
import {
  parseCharacterProfile,
  parseCharacterSkills,
} from '../src/services/character/definition.utils';

const CATALOG_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), 'characters.json');

/** 按 slug 插入尚不存在的官方角色（id 由 Prisma 生成）；已有行不改。 */
export async function seedCharacterCatalog(): Promise<void> {
  const parsed: unknown = JSON.parse(readFileSync(CATALOG_PATH, 'utf8'));
  if (!Array.isArray(parsed)) {
    throw new Error('prisma/characters.json 须为数组');
  }

  for (const entry of parsed) {
    if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new Error('prisma/characters.json 每条须为对象');
    }

    const { slug, profile, skills, extract } = entry as Record<string, unknown>;
    if (typeof slug !== 'string' || slug.trim() === '') {
      throw new Error('角色缺少 slug');
    }
    if (typeof extract !== 'string') {
      throw new Error(`角色 ${slug} 的 extract 须为字符串`);
    }

    parseCharacterProfile(profile);
    parseCharacterSkills(skills);

    const existing = await prisma.character.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (existing) continue;

    await prisma.character.create({
      data: {
        slug,
        profile: profile as InputJsonValue,
        skills: skills as InputJsonValue,
        extract,
      },
    });
  }
}
