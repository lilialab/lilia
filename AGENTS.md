<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# pai-arbor Agent 指南

本地 RAG 聊天应用（Next.js + Prisma + Chroma + Ollama）。

**读代码顺序**：Grep / Glob 定位 → 再 Read 目标文件。禁止为「摸结构」做全仓 explore、整目录 Read、或启动全仓 subagent。

## 代码导航

| 层级 | 路径 |
|------|------|
| HTTP 入口 | `src/app/api/`：改 API 先读对应 `route.ts`，再进 service |
| 业务逻辑 | `src/services/{domain}/`（域见下表） |
| 共享类型 | `src/types/`（如 `memory.ts`、`consolidation-job.ts`） |
| 服务端基础设施 | `src/lib/server/`（env、prisma、chroma、ollama、logger） |
| 浏览器 HTTP 封装 | `src/client-api/`（auth、sessions、groups…） |
| 客户端基础设施 | `src/lib/client/`（`api-fetch`、`query-keys`、cn、toast） |
| 同构纯函数 | `src/utils/`（无 I/O；前后端可共用，如 timezone、message-parts、scroll） |
| 前端页面 | `src/app/(main)/`（通讯录、我）、`src/app/chat/`、`src/app/groups/`、`src/app/login/`、`register/` |
| 路由保护 | `src/proxy.ts`（Next.js 16；**不是** `middleware.ts`） |
| 通用组件 | `src/components/` |
| 单测 | `tests/` 镜像 `src/` 路径；**不**在 `src/` 内 co-locate |

### services 域

| 目录 | 职责 |
|------|------|
| `chat/` | 单聊流、prompt、消息 |
| `group/` | 群聊流、群消息、群 prompt |
| `memory/` | 记忆整理、向量检索、衰减、metadata、用户画像、job |
| `session/` | 会话 |
| `character/` | AI 角色、通讯录、联系人 session |
| `knowledge/` | 文档导入、file 记录 |
| `debug/` | Chroma 调试 |
| `user/` | 注册；`resolveUserIdByUsername` |

Import：同域 service 用 `./`；跨域用 `@/services/{domain}/...`。**不要**恢复 `src/services/` 根目录平铺旧路径。

## 命令与环境

- Shell（WSL / NixOS）：一律 `nix develop --command …`（例：`nix develop --command pnpm lint`）
- 改完至少跑：`pnpm lint`（eslint + `tsc --noEmit`）、`pnpm test:run`；涉及格式时再 `pnpm format`
- 本地记忆联调：`pnpm dev:all`（Next + extract/maintain Worker；需 Redis）
- 单测需要完整 `.env`（含 `AUTH_SESSION_*`、`MEMORY_MAINTAIN_*` 等）；无默认 fallback
- Prisma schema 变更：`pnpm exec prisma generate`；必要时 `pnpm exec prisma db push`
- **禁止**：改 `docker-volumes/`；提交 `.env`；用户未要求时 `git commit`；编辑 `.cursor/plans/` 下的 plan

## 前后端约定

### Route / Service

| 层级 | 职责 | 禁止 |
|------|------|------|
| `route.ts` | 鉴权、入参校验、调 service、`withApiHandler` / `successResponse` | 写业务分支；把领域错误再翻译一层 |
| service | 业务逻辑；领域错误抛 `AppError` | 自行 `NextResponse.json` |

- 成功体：`{ success: true, data }`（`data` 必填；无业务数据用 `null` 或 `{ ok: true }`）
- 失败体：`{ success: false, error }`（由 `withApiHandler` 映射 `AppError`）
- **领域错误**（不存在、未加好友、状态不允许等）→ service 抛 `AppError`
- **HTTP 边界错误**（未登录、body/query 解析失败）→ route / `parse-schema` / `resolveRequestUserId` 抛
- 环境变量只读 `src/lib/server/env.ts`
- 记忆类型只用 `src/types/memory.ts` 的 `MemoryType` / `isMemoryType`

### 客户端

调用链：UI（Form / Hook）→ `src/client-api/*` → `apiFetchJson` → `/api/*`。

- React Query：`query-keys.ts`；Hook 负责缓存编排
- **禁止**在组件里手写 fetch URL

### 鉴权（双轨，勿混用）

| 方式 | 用法 | 适用 |
|------|------|------|
| Cookie | `resolveRequestUserId(req)`；`proxy.ts` 保护页面 | chat、sessions、`/api/auth/*`；页面 `/contacts`、`/chat/*`、`/groups`、`/me` |
| username | `resolveUserIdByUsername` + `?username=` | `/api/memory/*`；Bruno「记忆」 |

**禁止**：memory route 使用 `resolveRequestUserId`。

### 多用户隔离

Session、UserMemory、Chroma 查询必须带 `userId`。改 chat / memory 时检查是否漏隔离。

### AI SDK v6

- 浏览器聊天流：`DefaultChatTransport({ credentials: 'include' })`（见 `ChatScreen.tsx`）
- **禁止**在 `useChat` / `sendMessage` 的 options 里写 `credentials`（`ChatRequestOptions` 不支持）

### LLM 输出后处理

- 主约束在 prompt / 协议；仅对已知协议泄漏做薄清洗（例：群聊说话人前缀）
- 清洗逻辑的「为何防御」写在**调用处**；函数 JSDoc 只写行为
- 新模型怪癖：优先改 prompt / 协议，勿堆正则穷举

## API schemas

- 入参：`src/schemas/api/{domain}/`；跨域共享字段 → `src/schemas/shared/`
- Route 解析：`parseJsonBody` / `parseSearchParams`（`src/lib/server/parse-schema.ts`）

## 代码风格

- 格式：以 [`dprint.json`](dprint.json) 为准；改完跑 `pnpm format`
- Lint / 类型习惯：以 [`eslint.config.mjs`](eslint.config.mjs) 为准
- 冲突时：**可读性优先于机械统一**

细则：

- 优先 ES2015+（async/await、解构、可选链等）
- TSX 条件渲染：仅「条件成立才渲染」→ `cond && <A />`；勿写 `cond ? <A /> : null`
- TSX 三元：`A : B` 两边都要渲染时可保留；任一**分支体积**过大（多元素 / 多层级 JSX）→ 抽同文件私有组件，或改 early return；勿把大块 JSX 留在 `? :` 内
- React 组件 props：必须用具名 `XxxProps`（`interface` / `type`），再 `({ … }: XxxProps)`；禁止 `({ foo }: { foo: T })` 内联 props 类型
- 列表变换默认 `map` / `filter` / `reduce` / `flatMap`；顺序副作用或 `await` → `for...of`（勿 `forEach` + async）；禁用 `for...in`（ESLint）
- 数组更新用非破坏性 API：`toSorted` / `toReversed` / `toSpliced` / `with`；取末项等优先 `.at()`；禁用会改原数组的 `sort` / `reverse` / `splice`（unicorn）
- 类型：`import type { … }`；数组写 `T[]`，勿写 `Array<T>`
- 可选对象字段：扁平写 `key: value | undefined`；勿 `...(cond ? { key: value } : {})`
- 默认值用 `??`（仅 `null` / `undefined` 时 fallback）；布尔组合、以及空串也要当「无」时用 `||`（如 `trim() || '默认'`）
- `src/services/` 的 export 函数：补简短中文 JSDoc
- Diff：只改任务相关代码；未经要求不加测试 / 文档

业务逻辑放 `services/`（或页面旁私有模块）。有域语义的纯函数跟域走（`services/**/**.utils.ts`）。`src/utils/` 仅**同构纯函数**（无 I/O、不依赖 Next/Prisma/env；前后端都可 import）。

## 测试

- 改纯函数 / utils：同步更新 `tests/` 对应用例
- 依赖 Ollama / Chroma / MySQL 的路径：不强制 E2E；至少 `pnpm test:run` + `pnpm lint`

## 任务入口

| 任务 | 先读 |
|------|------|
| 聊天 / system prompt | `src/services/chat/prompt-builder.service.ts`；文案 `src/prompts/` |
| 群聊 | `group-chat.service.ts` + `group-message.service.ts` + `group-prompt.service.ts`；@ / turn_cue 见 [`docs/groups/mention-turn-cue.md`](docs/groups/mention-turn-cue.md) |
| 记忆整理 | `consolidation.service.ts` + `consolidation.utils.ts` |
| 记忆检索 / 衰减 | `vector.service.ts` + `decay.utils.ts` + `metadata.utils.ts` |
| 用户画像 | `user-profile.service.ts` |
| 会话 / 历史 | `sessions.service.ts` + `message.service.ts` |
| 知识库上传 | `src/app/api/upload/route.ts` + `src/services/knowledge/` |
| 记忆流水线 | [`docs/memory/pipeline.md`](docs/memory/pipeline.md)；`bruno/记忆/`；`src/app/api/memory/?username=`；`pnpm worker:memory-extract` / `worker:memory-maintain` |
| 登录 / 注册 | `session.ts` + `request-user.ts`；`src/app/api/auth/`；`src/client-api/auth.ts`；`login/`、`register/` |
| 聊天 UI / 流 | `ChatScreen.tsx` + `src/app/api/chat/route.ts` |
| 通讯录 | `contacts.service.ts`；`/contacts`、`/chat/add`、`/chat/[characterId]` |

非必要不要一次读完 chat + memory + group 全链路。
