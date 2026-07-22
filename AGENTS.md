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
| 客户端 | `src/lib/client/`（`api/*` 域 API；`api-fetch.ts`、`query-*` transport/缓存） |
| 前端页面 | `src/app/(main)/`（通讯录/我）、`src/app/chat/`（单聊/添加）、`src/app/login/`、`register/` |
| 路由保护 | `src/proxy.ts`（Next.js 16 proxy，非 `middleware.ts`） |
| 通用组件 | `src/components/` |
| 单测 | `tests/` 镜像 `src/`，不在 `src/` 内 co-locate |

### services 域划分

| 目录 | 职责 |
|------|------|
| `chat/` | 单聊流、prompt 组装、消息 |
| `group/` | 群聊流、群消息、群 prompt |
| `memory/` | 记忆整理、向量检索、衰减、metadata 解析、用户画像、job |
| `session/` | 会话 |
| `character/` | AI 角色目录、通讯录（加好友）、联系人 session |
| `knowledge/` | 文档导入、file 记录 |
| `debug/` | Chroma 调试 |
| `user/` | 用户注册、按 username 解析 userId（`resolveUserIdByUsername`） |

## 命令与环境

- **WSL / NixOS**：所有 shell 命令须 `nix develop --command ...`（如 `nix develop --command pnpm lint`）
- 改完验证：`pnpm test:run`、`pnpm lint`（`eslint` + `tsc --noEmit`）；本地联调记忆：`pnpm dev:all`（Next + extract/maintain Worker；需 Redis）
- 单测依赖完整 `.env`（含 `AUTH_SESSION_*`、`MEMORY_MAINTAIN_*` 等），无 fallback
- Schema 变更：`pnpm exec prisma generate`（必要时 `pnpm exec prisma db push`）
- 勿改 `docker-volumes/`；勿提交 `.env`
- 用户未要求时不 `git commit`；不编辑 `.cursor/plans/` 中的 plan 文件

## 前后端约定

**Route / Service**

- Route Handler：薄层，鉴权 + 参数校验 + 调 service + `withApiHandler` / `successResponse`；不写业务分支
- 成功响应统一 `{ success: true, data }`（`data` 必填；无业务体用 `null` 或 `{ ok: true }`）；失败 `{ success: false, error }`
- **业务 / 领域错误**（不存在、未加好友、状态不允许等）：在 **service** 抛 `AppError`；route 不要再翻译或重包一层
- **HTTP 边界错误**（未登录、body/query 解析失败）：在 route / `parse-schema` / `resolveRequestUserId` 抛
- service **不要**自行 `NextResponse.json`；统一由 `withApiHandler` 把 `AppError` 映射为 JSON
- 同域 service 用 `./` 相对路径；跨域用 `@/services/{domain}/...`
- 环境变量仅通过 `src/lib/server/env.ts`；记忆类型用 `src/types/memory.ts` 的 `MemoryType` / `isMemoryType`

**客户端**

- UI（Form / Hook）→ `src/lib/client/api/*` → `apiFetchJson` → `/api/*`
- transport：`api-fetch.ts` / `api-client.ts`；React Query 用 `query-keys.ts`，Hook 负责编排缓存

**鉴权双轨**

- Cookie：`resolveRequestUserId(req)` → chat、sessions、`/api/auth/*`；`src/proxy.ts` 保护 `/contacts`、`/chat/*`、`/me`
- username：`resolveUserIdByUsername` + query `?username=` → `/api/memory/*`；Bruno「记忆」

**多用户隔离**

- Session、UserMemory、Chroma 检索均按 `userId` 隔离；改 chat/memory 逻辑勿漏 userId

**AI SDK v6**

- 聊天流 Cookie 走 `DefaultChatTransport({ credentials: 'include' })`（见 `ChatScreen.tsx`）

**LLM 输出防御性后处理**

- 主约束用 prompt / 协议；已知协议泄漏可保留薄层清洗（如群聊 `(slug):`）
- 「防御性」写在**调用处**，函数 JSDoc 只描述行为；勿穷举怪癖，新问题优先改 prompt / 协议

## API schemas

- 入参校验：`src/schemas/api/{domain}/`；共享字段（如 username）→ `src/schemas/shared/`
- Route 用 `parseJsonBody` / `parseSearchParams`（`src/lib/server/parse-schema.ts`）

## 代码风格

与 [`eslint.config.mjs`](eslint.config.mjs)、[`.prettierrc`](.prettierrc) 保持一致；**可读性优先，不必为统一风格牺牲可读性**。

- 优先 ES2015+（async/await、解构、可选链等）；折行按 Prettier `printWidth: 100`
- 数据变换默认 `map` / `filter` / `reduce` / `flatMap`；需顺序副作用或 `await` 时用 `for...of`（勿 `forEach` + async）；`for...in` 禁用（ESLint）
- 数组更新优先非破坏性：`toSorted` / `toReversed` / `toSpliced` / `with`；负向索引读元素优先 `.at()`；禁止依赖会改原数组的 `sort` / `reverse` / `splice`（ESLint unicorn）
- 类型导入写 `import type { ... }`；数组类型写 `T[]` 不用 `Array<T>`
- 组装对象避免 `...(cond ? { key } : {})`；直接写扁平字段（缺省用 `undefined`），由序列化或下游忽略
- `src/services/` 下 export 函数补简短中文 JSDoc
- 最小 diff：不顺手重构无关代码；不加用户未请求的测试或文档

## 测试

- 纯函数 / utils：改逻辑须同步更新对应用例（`tests/services/`、`tests/app/`、`tests/schemas/`）
- 依赖 Ollama / Chroma / MySQL 的 service：不强行 E2E；改完至少 `pnpm test:run` + `pnpm lint`

## 任务入口（快捷）

| 任务 | 先看 |
|------|------|
| 聊天 / system prompt | `src/services/chat/prompt-builder.service.ts`；人设与 jobs 文案见 `src/prompts/` |
| 群聊 | `src/services/group/group-chat.service.ts` + `group-message.service.ts` + `group-prompt.service.ts` |
| 记忆整理 | `src/services/memory/consolidation.service.ts` + `consolidation.utils.ts` |
| 记忆检索 / 衰减 | `src/services/memory/vector.service.ts` + `decay.utils.ts` + `metadata.utils.ts` |
| 用户画像 | `src/services/memory/user-profile.service.ts` |
| 会话 / 历史消息 | `src/services/session/sessions.service.ts` + `src/services/chat/message.service.ts` |
| 知识库上传 | `src/app/api/upload/route.ts` + `src/services/knowledge/` |
| 记忆流水线（脚本） | [`docs/memory/pipeline.md`](docs/memory/pipeline.md) + `bruno/记忆/` + `src/app/api/memory/`（`?username=`）+ `pnpm worker:memory-extract` / `pnpm worker:memory-maintain` |
| 登录 / 注册 / Cookie 会话 | `src/lib/server/session.ts` + `request-user.ts` + `src/app/api/auth/` + `src/lib/client/api/auth.ts` + `src/app/login/`、`register/` |
| 聊天 UI / 流式请求 | `src/app/chat/components/ChatScreen.tsx` + `src/app/api/chat/route.ts` |
| 通讯录 / 加 AI 好友 | `src/services/character/contacts.service.ts` + `/contacts`、`/chat/add`、`/chat/[characterId]` |

## 避免

- 组件里不要写 fetch URL；memory route 不要用 `resolveRequestUserId`
- `useChat` / `sendMessage` 的 options 不要写 `credentials`（`ChatRequestOptions` 不支持）
- 不为「了解项目结构」启动全仓 subagent 扫描
- 非必要不要同时读 chat + memory + knowledge 全链路
- 不要把业务逻辑放进 `src/utils/`（通用工具如 scroll 除外）
- 不要恢复 `src/services/` 根目录平铺的旧 import 路径
- 不要用 `...(cond ? { key: value } : {})` 拼可选字段；写成扁平 `key: value | undefined`
