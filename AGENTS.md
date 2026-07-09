<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# pai-arbor Agent 指南

本地 RAG 聊天应用（Next.js + Prisma + Chroma + Ollama）。探索代码时 **先用 Grep/Glob 定位，再 Read**；非必要不做 broad explore 或整目录 Read。

## 代码导航

| 层级 | 路径 |
|------|------|
| HTTP 入口 | `src/app/api/`（改 API 行为先看 `route.ts`，再进 service） |
| 业务逻辑 | `src/services/` 按域分子目录（见下表） |
| 共享类型 | `src/types/`（如 `memory.ts`、`consolidation-job.ts`） |
| 服务端基础设施 | `src/lib/server/`（env、prisma、chroma、ollama、logger） |
| 前端页面 | `src/app/chat/` |
| 通用组件 | `src/components/` |
| 单测 | `tests/` 镜像 `src/`，不在 `src/` 内 co-locate |

### services 域划分

| 目录 | 职责 |
|------|------|
| `chat/` | 聊天流、prompt 组装、消息 |
| `memory/` | 记忆整理、向量检索、衰减、metadata 解析、用户画像、job |
| `session/` | 会话 |
| `knowledge/` | 文档导入、file 记录 |
| `debug/` | Chroma 调试 |

## 命令与环境

- 跑脚本：`nix develop --command pnpm <script>`
- 改完验证：`pnpm test:run`、`pnpm lint`
- Schema 变更：`pnpm exec prisma generate`（必要时 `pnpm exec prisma db push`）
- 勿改 `docker-volumes/`；勿提交 `.env`
- 用户未要求时不 `git commit`；不编辑 `.cursor/plans/` 中的 plan 文件

## 分层与 import

- Route Handler：薄层，参数校验 + 调 service + `withApiHandler` / `successResponse`
- 同域 service 用 `./` 相对路径；跨域用 `@/services/{domain}/...`
- 环境变量仅通过 `src/lib/server/env.ts`，不要散落 `process.env`
- 记忆类型用 `src/types/memory.ts` 的 `MemoryType` / `isMemoryType`，不要内联 union

## 代码风格

与 `eslint.config.mjs` 保持一致：

- 禁止 `for...in`；数据变换优先 `map` / `filter` / `reduce` / `flatMap`；顺序副作用或需 `await` 的遍历可用 `for...of`（避免 `forEach` + async）
- 类型导入写 `import type { ... }`；数组类型写 `T[]` 不用 `Array<T>`
- `src/services/` 下 export 函数补简短中文 JSDoc
- 最小 diff：不顺手重构无关代码；不加用户未请求的测试或文档

## 测试

- 纯函数 / utils：改逻辑须同步更新 `tests/services/**` 对应用例
- 依赖 Ollama / Chroma / MySQL 的 service：不强行 E2E；改完至少 `pnpm test:run` + `pnpm lint`

## 任务入口（快捷）

| 任务 | 先看 |
|------|------|
| 聊天 / system prompt | `src/services/chat/prompt-builder.service.ts` |
| 记忆整理 | `src/services/memory/consolidation.service.ts` + `consolidation.utils.ts` |
| 记忆检索 / 衰减 | `src/services/memory/vector.service.ts` + `decay.utils.ts` + `metadata.utils.ts` |
| 用户画像 | `src/services/memory/user-profile.service.ts` |
| 会话 / 历史消息 | `src/services/session/sessions.service.ts` + `src/services/chat/message.service.ts` |
| 知识库上传 | `src/app/api/upload/route.ts` + `src/services/knowledge/` |
| 记忆流水线手动触发 | `bruno/记忆/`（extract / maintain / profile API 在 `src/app/api/memory/`） |

详细流程见 [`docs/memory/pipeline.md`](docs/memory/pipeline.md)。

## 避免

- 不为「了解项目结构」启动全仓 subagent 扫描
- 非必要不要同时读 chat + memory + knowledge 全链路
- 不要把业务逻辑放进 `src/utils/`（通用工具如 scroll 除外）
- 不要恢复 `src/services/` 根目录平铺的旧 import 路径
