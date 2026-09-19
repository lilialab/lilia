import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prisma } from '../src/lib/server/prisma';
import {
  parseCharacterProfile,
  parseCharacterSkills,
} from '../src/services/character/definition.utils';

const CATALOG_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), 'characters.json');

/**
 * 按 slug 对齐官方角色目录：缺失则新建，已有且属官方则覆盖人设，属用户自建则跳过。
 * 只覆盖 JSON 里有的列（name / shortBio / profile / skills / extract），不动 ownerId / deletedAt / avatarKey。
 */
export async function seedCharacterCatalog(officialUserId: string): Promise<void> {
  const parsed: unknown = JSON.parse(readFileSync(CATALOG_PATH, 'utf8'));
  if (!Array.isArray(parsed)) {
    throw new Error('prisma/characters.json 须为数组');
  }

  for (const entry of parsed) {
    if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new Error('prisma/characters.json 每条须为对象');
    }

    const { slug, name, shortBio, profile, skills, extract } = entry as Record<string, unknown>;
    if (typeof slug !== 'string' || slug.trim() === '') {
      throw new Error('角色缺少 slug');
    }
    if (typeof name !== 'string' || name.trim() === '') {
      throw new Error(`角色 ${slug} 缺少 name`);
    }
    if (typeof shortBio !== 'string') {
      throw new Error(`角色 ${slug} 的 shortBio 须为字符串`);
    }
    if (typeof extract !== 'string') {
      throw new Error(`角色 ${slug} 的 extract 须为字符串`);
    }

    const data = {
      name: name.trim(),
      shortBio,
      profile: parseCharacterProfile(profile),
      skills: parseCharacterSkills(skills),
      extract,
    };

    const existing = await prisma.character.findUnique({
      where: { slug },
      select: { ownerId: true },
    });

    if (existing) {
      // 同 slug 已被用户自建占用时跳过，避免 seed 覆盖用户内容。
      if (existing.ownerId !== officialUserId) continue;
      await prisma.character.update({ where: { slug }, data });
      continue;
    }

    await prisma.character.create({
      data: { slug, ...data, ownerId: officialUserId },
    });
  }
}
