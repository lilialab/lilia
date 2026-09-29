import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/* -------------------------------------------------------------------------- */
/* 解析 AGENTS.md「任务入口」表                                                */
/* -------------------------------------------------------------------------- */

const ROOT = process.cwd();

/**
 * 取出「先读」列的引用：反引号片段 + markdown 链接目标。
 *
 * 排除两类非路径：`/` 开头的 URL 路由，以及带空白的散文（如 `PATCH /api/auth/me`）。
 * 其余引用按 AGENTS.md 记法行一律是仓库根全路径 —— 所以下面只做存在性校验，
 * 不需要任何简写解析。
 */
function readTaskEntryRefs(): string[] {
  const section = readFileSync(path.join(ROOT, 'AGENTS.md'), 'utf8').split(/^## 任务入口$/m)[1]
    ?? '';
  const body = section.split(/^## /m)[0] ?? '';
  const refs = new Set<string>();

  for (const line of body.split('\n')) {
    if (!line.startsWith('|')) continue;
    const cell = (line.split('|')[2] ?? '').trim();
    if (cell.length === 0 || cell === '先读' || /^-+$/.test(cell)) continue;

    for (const match of cell.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) refs.add(match[1].trim());
    for (const match of cell.matchAll(/`([^`]+)`/g)) refs.add(match[1].trim());
  }

  return [...refs].filter((ref) => ref.length > 0 && !ref.startsWith('/') && !/\s/.test(ref));
}

/* -------------------------------------------------------------------------- */
/* 校验                                                                        */
/* -------------------------------------------------------------------------- */

const refs = readTaskEntryRefs();

describe('AGENTS.md「任务入口」', () => {
  it('解析出的引用数量符合预期（防止解析退化成空集后静默通过）', () => {
    expect(refs.length).toBeGreaterThan(30);
  });

  it('引用必须是仓库根全路径，不许退回裸文件名或域内简写', () => {
    const bare = refs.filter((ref) => !ref.includes('/'));
    expect(bare).toEqual([]);
  });

  it('每个引用都必须在磁盘上存在（文件或目录）', () => {
    const missing = refs
      .filter((ref) => !existsSync(path.join(ROOT, ref)))
      .map((ref) => `${ref} → 不存在`);
    expect(missing).toEqual([]);
  });
});
