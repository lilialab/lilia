---
name: maintain-skills
description: >-
  Reviews and updates project Cursor skills under .cursor/skills/ after features
  ship or when skills drift. Use when the user says 看看要不要改项目里的 skills,
  维护 skills、更新 skill、skill 过时了, or asks to optimize/sync project skills
  after a large change—not for routine app coding.
---

# 维护项目 Skills

## 目标

在大功能落地或约定变更后，检查并更新 **当前仓库** `.cursor/skills/*/SKILL.md`，避免 Agent 按过时说明办事。

## 何时启用

典型用法（优先）：

- 大功能做完 → 用户说「看看要不要改项目里的 skills」
- 明确点名某个 skill 要改 / 过时 / 优化

**不要**在普通改业务代码时主动跑整套维护流程。

## 硬约束

- 默认只动本仓库 `.cursor/skills/`（或用户点名的 skill 路径）；**不要**借机大改业务代码
- **不要**把 `AGENTS.md` / 规则文件整段复制进 skill
- 新建 skill 的写法遵循 Cursor `create-skill`；本 skill 管「审与改」，不是从零教 YAML
- 改前先给出简短「建议变更」；用户没反对或已说「改吧」再写文件
- 保持 skill **短**：优先改 description 触发词、过时清单、硬约束；少灌背景故事

## 流程

1. **盘点**：列出 `.cursor/skills/` 下现有 skill（读各 `SKILL.md` 的 `name` / `description` / 关键章节）。
2. **对照**：结合本轮对话或刚完成的功能，判断哪些 skill 的约定、检查清单、触发词已不准；无关的标「无需改」。
3. **提案**（先输出再改）：

```markdown
## Skills 维护建议
- **无需改**：…
- **建议更新**：
  - `skill-name`：改什么（一句话）+ 为什么
- **建议新建**（仅当确有重复工作流且现有 skill 盖不住）：…
- **建议删除/合并**（极少）：…
```

4. **执行**：按用户确认更新对应 `SKILL.md`；顺带检查 description 是否含 WHAT + WHEN、第三人称、能命中用户真实说法。
5. **回报**：列出改了哪些文件、各一句话。

## 评审时问自己

- 这段 Agent 是否已经从项目规则 / 代码能知道？（能则删）
- description 是否仍能命中用户的真实说法？
- 正文里的清单或硬约束是否与**当前**产品/工程行为一致？

## 与 requirements-audit

需求讨论用 `requirements-audit`。本 skill 只在 **skill 文档本身** 需要同步时使用；二者不要互相替代。
