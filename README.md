# pai-arbor

基于 Next.js 的本地聊天应用，带按用户与角色的长期记忆：离线从对话抽取、整理与画像维护，聊天时向量检索相关记忆并注入 prompt。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Next.js 16、React 19、Tailwind CSS 4、Vercel AI SDK |
| 后端 | Next.js Route Handlers |
| 关系数据库 | MySQL 8 + Prisma 7 |
| 向量数据库 | ChromaDB |
| 任务队列 | Redis（BullMQ 后端） |
| 日志 | Loki + Grafana（pino 推送） |
| 模型服务 | OpenAI 兼容对话 API + OpenAI 兼容 Embedding（如硅基 Qwen3-Embedding） |

## 前置依赖

- [Node.js](https://nodejs.org/) 24+ 与 [pnpm](https://pnpm.io/)
- [Docker](https://www.docker.com/)（运行 MySQL、Chroma、Redis 等）
- 第三方对话与 Embedding API Key（如 [硅基流动](https://siliconflow.cn) / [DeepSeek](https://platform.deepseek.com)）

可选：使用项目自带的 Nix flake 开发环境（Node 24 + pnpm）：

```bash
nix develop
```

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

按需修改 `.env` 中的数据库、Chroma、对话 LLM 与 Embedding 配置。

### 3. 启动基础设施

```bash
docker compose up -d
```

将启动以下服务：

| 服务 | 端口 | 用途 |
|------|------|------|
| MySQL | 3306 | 会话、消息、记忆元数据 |
| ChromaDB | 8000 | 记忆向量检索 |
| Redis | 6379 | BullMQ 任务队列 |
| Loki | 3100 | 日志接收 API（无 Web UI，应用往这里推送） |
| Grafana | 3001 | 日志查询界面（admin / admin） |

#### 日志与调试

应用通过 [pino](https://getpino.io/) 输出结构化日志，LLM 请求/回复、记忆片段等动态上下文写入 Loki（不记录固定 system 提示词全文）。

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `LOG_LEVEL` | 日志级别 | `debug` |
| `LOKI_URL` | Loki 推送地址 | `http://localhost:3100` |
| `LOG_TO_LOKI` | 是否推送到 Loki | `true` |

- Grafana：[http://localhost:3001](http://localhost:3001) → Explore → 数据源 Loki（Label filters 可选 `event`）
- 重启应用后新日志带 `event` label；
- 聊天请求（记忆片段等）：`{app="pai-arbor", event="llm.chat.request"}`
- 聊天回复：`{app="pai-arbor", event="llm.chat.response"}`
- 按消息过滤：`{app="pai-arbor"} | json | userMessageId="<uuid>"` 或 `assistantMessageId`
- 记忆整理：`{app="pai-arbor", event=~"llm.consolidation.*"}`
- 整理结果摘要：`{app="pai-arbor", event="llm.consolidation.complete"}`
- globalMax 前缀标记：`{app="pai-arbor", event="llm.consolidation.mark"}`
- 按 job 过滤：`{app="pai-arbor"} | json | jobId="<uuid>"`
- 设 `LOG_TO_LOKI=false` 时不记录日志（终端也不会有输出）

`consolidation_jobs.snapshot` 仅保留 `messageIds` / `userId`；LLM 输入输出在 Loki 中查询。

### 4. 初始化数据库

```bash
pnpm exec prisma generate
pnpm exec prisma db push
```

### 5. 准备对话 LLM 与 Embedding

对话与记忆 Job 走 `.env` 中的 `LLM_*`；向量检索走 `EMBED_*`（OpenAI 兼容 `/v1/embeddings`，例如硅基 `Qwen/Qwen3-Embedding-8B`）。若 LLM 也在硅基，可与 Embedding 共用 Base URL 与 API Key。

更换 Embedding 模型后请清空或重建 Chroma collection（向量空间不兼容）。

### 6. 启动开发服务器

```bash
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000)：

## 环境变量

服务端统一从 [`src/lib/server/env.ts`](src/lib/server/env.ts) 读取配置；本地开发可复制 [`.env.example`](.env.example) 为 `.env`。**均为必填**（未设置则启动报错）。不要把 API Key 写进日志。

| 变量 | 说明 | 必填 |
|------|------|------|
| `REDIS_URL` | Redis 地址（BullMQ）；依赖 compose 中的 Redis 服务 | 是 |
| `MEMORY_EXTRACT_IDLE_MINUTES` | 用户发消息后闲置多久触发 extract（分钟）；发消息会重置 | 是 |
| `MEMORY_MAINTAIN_IDLE_HOURS` | 用户发消息后闲置多久才考虑触发 maintain（小时）；发消息会重置 | 是 |
| `MEMORY_MAINTAIN_MIN_INTERVAL_HOURS` | 距上次 maintain 管线完成至少该小时数后才执行 | 是 |
| `CHAT_DAILY_TURN_LIMIT` | 每用户每天（UTC）单聊 + 群聊合计次数上限 | 是 |

## 开发说明

- 本项目使用 **Next.js 16**，部分 API 与常见版本存在差异，编写代码前建议查阅 `node_modules/next/dist/docs/`。
- Prisma Client 生成路径为 `src/generated/prisma`，Schema 变更后需重新执行 `pnpm exec prisma generate`。

## 常用命令

```bash
pnpm dev          # 启动开发服务器
pnpm dev:all      # Next + extract/maintain Worker（需 Redis；一条命令）
pnpm build        # 构建生产版本
pnpm start        # 启动生产服务器
pnpm lint         # ESLint 检查
pnpm worker:memory-extract  # 记忆整理 Worker（需 Redis；另开终端）
pnpm worker:memory-maintain  # maintain→profile 闲置窗口（需 Redis；另开终端）


# 根据 schema 生成 Prisma Client（类型与 API）；migrate / db push 通常会顺带跑
pnpm exec prisma generate

# 开发：把 schema 同步到数据库（不生成迁移文件）
pnpm exec prisma db push

# 开发：清空库并按 schema 重建（会丢数据）
pnpm exec prisma db push --force-reset

# 灌入种子数据（如默认角色 arbor）
pnpm exec prisma db seed

# 开发：根据 schema 变更生成迁移并应用到本地库
pnpm exec prisma migrate dev

# 生产：执行 migrations 里尚未跑过的 SQL
pnpm exec prisma migrate deploy
```
