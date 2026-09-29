<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# lilia Agent 指南

带长期记忆的本地聊天应用（Next.js + Prisma + Chroma + OpenAI 兼容 LLM/Embedding）。

## 读文件

读多少由任务决定，不由文件大小决定。

Grep / Glob 定位 → 再 Read。按下方「任务入口」定点读；禁止全仓 explore、整目录 Read、全仓 subagent，或一次串读 chat + memory + group 全链路。大范围探查（多文件、一条链路）交给 subagent，主上下文只收结论。

- **评审改动**：读改动本身（`git diff` 或改动处），不整读文件 —— 未改动的部分不是评审对象。
- **评审整体设计 / 可读性**：整读目标文件（或整套模块）再下结论。
- 提问没点明范围时（「你觉得怎么样」）：按最小够用读，并说明读了什么范围。

理由：`read` 不受 spill 保护（上限 `readLimit` 2000 行 / `readMaxBytes` 51200 字节），读进来的内容此后每轮都要重发。

## 代码导航

| 层级 | 路径 |
|------|------|
| HTTP 入口 | `src/app/api/`：改 API 先读对应 `route.ts`，再进 service |
| 业务逻辑 | `src/services/{domain}/`（域见下表） |
| 共享类型 | `src/types/`（如 `memory.ts`、`memory-job.ts`） |
| 服务端基础设施 | `src/lib/server/`（env、prisma、chroma、embeddings、llm、logger） |
| 浏览器 HTTP 封装 | `src/client-api/`（auth、sessions、groups…） |
| 客户端基础设施 | `src/lib/client/`（`api-fetch`、`query-keys`、cn、toast） |
| 同构纯函数 | `src/utils/`（无 I/O、不依赖 Next/Prisma/env；前后端可共用） |
| 前端页面 | `src/app/(main)/`、`src/app/chat/`、`src/app/groups/`、`src/app/guest/`、`src/app/login/`、`src/app/register/` |
| 路由保护 | `src/proxy.ts`（Next.js 16；**不是** `middleware.ts`） |
| 通用组件 | `src/components/` |
| 单测 | `tests/` 镜像 `src/`；**不**在 `src/` 内 co-locate |

### services 域

| 目录 | 职责 |
|------|------|
| `chat/` | 单聊流、prompt、消息 |
| `group/` | 群聊流、群消息、群 prompt |
| `memory/` | 记忆提取、向量检索、衰减、metadata、用户画像、job |
| `session/` | 会话 |
| `character/` | AI 角色、通讯录、联系人 session |
| `debug/` | 本地调试（Chroma、提取/维护/画像试运行） |
| `guest/` | 访客试聊（凭证、日限额、公开目录、独立消息表；不跑记忆） |
| `user/` | 注册登录、账号资料（改密/昵称/删号）、`resolveUserIdByAccount` |

- 同域 import：`./`；跨域：`@/services/{domain}/...`。**不要**恢复 `src/services/` 根目录平铺旧路径。
- 有域语义的纯函数跟域走：`services/**/**.utils.ts`（勿塞进 `src/utils/`）。

## 任务入口

记法：`/xxx` 是 URL 路由（可带方法）；其余引用一律仓库根全路径。校验见 `tests/agents-md.test.ts`。

| 任务 | 先读 |
|------|------|
| 聊天 / system prompt | `src/services/chat/prompt.service.ts`；`src/prompts/` |
| 群聊 | `src/services/group/chat.service.ts` / `src/services/group/message.service.ts` / `src/services/group/prompt.service.ts`；@ 见 [`docs/groups/mention-turn-cue.md`](docs/groups/mention-turn-cue.md) |
| 记忆提取 | `src/services/memory/extract.service.ts` + `src/services/memory/extract.utils.ts` |
| 记忆维护 | `src/services/memory/maintain.service.ts` + `src/services/memory/maintain.utils.ts` |
| 记忆检索 / 衰减 | `src/services/memory/vector.service.ts` + `src/services/memory/decay.utils.ts` + `src/services/memory/metadata.utils.ts` |
| 用户画像 | `src/services/memory/user-profile.service.ts` |
| 单聊会话 / 历史 | `src/services/session/sessions.service.ts` + `src/services/chat/message.service.ts` |
| 记忆流水线 | [`docs/memory/pipeline.md`](docs/memory/pipeline.md)；`bruno/debug/记忆/`；`/api/debug/memory/?account=`；`src/workers/memory-extract.worker.ts` / `src/workers/memory-maintain.worker.ts` |
| 登录 / 注册 | `src/lib/server/session.ts` + `src/lib/server/request-user.ts`；`src/app/api/auth/`；`src/client-api/auth.ts`；`src/app/login/`、`src/app/register/` |
| 账号设置 | `src/services/user/users.service.ts`；`PATCH /api/auth/me`（昵称等）；`src/app/api/auth/change-password/`、`src/app/api/auth/delete-account/`；`/me/settings` |
| 日配额 / 今日体力 | `src/services/chat/quota.service.ts`（读与扣同一个 Redis key，429 文案在此）；`src/app/api/chat/quota/`；`src/client-api/chat.ts`；`/me` 卡片 `src/app/(main)/me/MeStaminaCard.tsx` |
| 聊天 UI / 流 | `src/app/chat/components/ChatScreen.tsx` + `src/app/api/chat/` |
| 探索 / 角色目录 | `src/services/character/catalog.service.ts`；`src/services/character/create.service.ts`；`/explore`、`/explore/[characterId]` |
| 访客试聊 | `src/services/guest/`；`src/app/guest/`；`src/app/api/guest/`；`src/client-api/guest.ts` |
| 通讯录 | `src/services/character/contacts.service.ts`；`/contacts`、`/chat/[characterId]` |

## 命令与环境

- 沙箱只放行工作区写入：pnpm 加 `COREPACK_HOME=/tmp/corepack`，dprint 加 `DPRINT_CACHE_DIR=/tmp/dprint-cache`（默认 `~/.cache` 会被拦）
- 命令：`pnpm format`、`pnpm lint`、`pnpm test:run`、`pnpm exec prisma generate`
- 边界：`docker-volumes/`、`.env` 由用户维护；只允许执行上面「命令」列出的命令，迁移与连库由用户自己来

## 前后端约定

### Route / Service

| 层级 | 职责 | 禁止 |
|------|------|------|
| `route.ts` | 鉴权、入参校验、调 service、`withApiHandler` / `successResponse` | 业务分支；把 `AppError` 再翻译一层；手写失败 JSON |
| service | 业务逻辑；领域错误抛 `AppError` | `NextResponse.json` |
| HTTP 边界 | 未登录、body/query 解析失败 | — → route / `parse-schema` / `resolveRequestUserId` 抛 |

响应用 `successResponse` / `withApiHandler`（成功 `{ success, data }`，失败 `{ success, error }`；细节见 `api-handler`）。

- 环境变量只读 `src/lib/server/env.ts`
- 记忆类型只用 `src/types/memory.ts` 的 `MemoryType` / `isMemoryType`
- 入参 schema：`src/schemas/api/{domain}/`；共享字段 → `src/schemas/shared/`；Route 用 `parseJsonBody` / `parseSearchParams`

### 客户端

UI → `src/client-api/*` → `apiFetchJson` → `/api/*`。React Query 用 `query-keys.ts`，Hook 编排缓存。**禁止**组件内手写 fetch URL。

### 鉴权（双轨，勿混用）

| 方式 | 用法 | 适用 |
|------|------|------|
| Cookie | `resolveRequestUserId(req)`；页面由 `proxy.ts` 保护 | chat、sessions、`/api/auth/*`；需登录页 |
| account | `resolveUserIdByAccount` + `?account=` | `/api/debug/memory/*`；Bruno「debug / 记忆」 |

**禁止**：`/api/debug/memory/*` 使用 `resolveRequestUserId`。

### 其它

- 多用户：Session / UserMemory / Chroma 查询必须带 `userId`
- 聊天流：`DefaultChatTransport({ credentials: 'include' })`；**禁止**在 `useChat` / `sendMessage` options 写 `credentials`
- LLM 后处理：主约束在 prompt / 协议；薄清洗的「为何防御」写在调用处，JSDoc 只写行为；新怪癖优先改 prompt，勿堆正则

## 代码风格

- 格式：[`dprint.json`](dprint.json)（改完 `pnpm format`）；Lint：[`eslint.config.mjs`](eslint.config.mjs)。冲突时可读性优先。
- 分层（`utils` / `services` / `lib`）见「代码导航」，此处不重复。
- **可读性优先于防御性**：难读比偶发错误更糟。不为「万一」加多余分支、mirror state、双重解析、重复校验；边界校验只放在真正边界（route / 外部输入 / 跨信任域），内层信任上游。能用类型、命名、单测表达的，不用运行时 `if` 堆砌。
- 用户对代码风格 / 实现提出异议或质疑时（如「这样写有问题吗」「我不太喜欢」「为什么不…」）：优先对照社区主流做法与共识强弱（主流约定 / 常见偏好 / 有争议）来评估，再说明本仓库现有约定。不要默认维护现状或只给个人偏好；本仓与社区冲突时先讲清差异，再让用户决定跟谁。

细则：

- 优先 ES2015+（async/await、解构、可选链等）
- TSX：`cond && <A />`，勿 `cond ? <A /> : null`；真三元时分支体积过大 → 同文件私有组件或 early return
- React 组件 props：必须用具名 `XxxProps`，再 `({ … }: XxxProps)`；禁止内联 `({ foo }: { foo: T })`
- 列表：`map` / `filter` / `reduce` / `flatMap`；顺序副作用或 `await` → `for...of`；禁用 `for...in`、破坏性 `sort` / `reverse` / `splice`（用 `toSorted` 等 / `.at()`）
- `import type`；数组写 `T[]`
- 可选字段扁平：`key: value | undefined`；勿 `...(cond ? { key } : {})`
- 默认值用 `??`；布尔组合或空串也要 fallback 时用 `||`
- `src/services/` export 函数补简短中文 JSDoc
- **拆分与分段 banner**：先判断拆不拆，banner 不替代拆分。有独立职责/复用/嵌套过深 → 抽组件、hook 或域内 `*.utils.ts`；只出现一次且拆了更难读、或「将来可能复用」的提前拆 → 不拆。仍合在一处且偏长（约 ≥100～150 行或多段逻辑）→ 加 banner；短文件、`src/generated/`、单线薄封装不加。格式：

```
/* -------------------------------------------------------------------------- */
/* Section name                                                               */
/* -------------------------------------------------------------------------- */
```

  常见分段：Screen → `State & data` / `Handlers` / `Render`；service → `Types` / `Helpers` / `Public API`。顺序可按可读性微调，勿借机改逻辑。

## 测试

改纯函数 / utils：同步更新 `tests/` 对应用例。依赖 Ollama / Chroma / MySQL 的路径不强制 E2E（验证命令见上）。
