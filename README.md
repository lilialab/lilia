# lilia

基于 Next.js 的本地聊天应用，带按用户与角色的长期记忆：离线从对话抽取、整理与画像维护，聊天时向量检索相关记忆并注入 prompt。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Next.js 16、React 19、Tailwind CSS 4、Vercel AI SDK |
| 后端 | Next.js Route Handlers |
| 关系数据库 | MySQL 8 + Prisma 7 |
| 向量数据库 | ChromaDB |
| 任务队列 | Redis（BullMQ 后端） |
| 日志 | pino（stdout；可选 Loki + Grafana） |
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

将启动以下服务（端口均绑在 127.0.0.1，仅本机可连）：

| 服务 | 端口 | 用途 |
|------|------|------|
| MySQL | 3306 | 会话、消息、记忆元数据 |
| ChromaDB | 8000 | 记忆向量检索 |
| Redis | 6379 | BullMQ 任务队列 |
| SeaweedFS | 8333 | 对象存储 S3 API |
| Loki | 3100 | 日志接收 API（无 Web UI，应用往这里推送） |
| Grafana | 3001 | 日志查询界面（admin / password） |

本地和生产用同一份 `docker-compose.yml`，`docker compose up -d` 会起上表全部服务。Loki / Grafana 的数据目录权限由一次性服务 `loki-grafana-init` 在启动前自动 `chown`（Loki=10001、Grafana=472），新机不必再手动建目录。

端口不对公网开放。从本机连 VPS 上的 Grafana / MySQL / Redis 时，用 SSH 本地转发。

```bash
ssh -L 3001:127.0.0.1:3001 -L 3306:127.0.0.1:3306 -L 6379:127.0.0.1:6379 user@your-vps
```

- Grafana：浏览器打开 [http://localhost:3001](http://localhost:3001)（`admin` / `password`）
- SeaweedFS S3：[http://localhost:8333](http://localhost:8333)（`.env` 里的 `S3_ACCESS_KEY` / `S3_SECRET_KEY`，桶 `S3_BUCKET`）
- MySQL / Redis：DBeaver、Redis Insight 等连本机对应端口即可
- `exit` 结束 SSH 后转发即关闭。

Grafana 只是查 Loki 的 UI，停掉不影响写日志。在 VPS 的 compose 目录里只动这一个服务：

```bash
docker compose start grafana       # 打开（容器还在，只是停了）
docker compose stop grafana        # 关闭；数据仍在 docker-volumes/grafana-data
```

#### 日志与调试

应用通过 [pino](https://getpino.io/) 打结构化日志：**始终写 stdout**；`LOG_TO_LOKI=true` 时额外推 Loki。LLM 请求/回复、记忆片段等动态上下文带 `event`（不记录固定 system 提示词全文）。

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `LOG_LEVEL` | 日志级别 | `debug` |
| `LOKI_URL` | Loki 推送地址 | `http://localhost:3100` |
| `LOG_TO_LOKI` | 是否额外推送到 Loki | `true` |

- Grafana：[http://localhost:3001](http://localhost:3001) → Explore → 数据源 Loki（Label filters 可选 `event`）
- 终端 / `docker logs` 可直接看 pino JSON；Loki 挂了仍有 stdout
- 重启应用后新日志带 `event` label；
- 聊天请求（记忆片段等）：`{app="lilia", event="llm.chat.request"}`
- 聊天回复：`{app="lilia", event="llm.chat.response"}`
- 按消息过滤：`{app="lilia"} | json | userMessageId="<uuid>"` 或 `assistantMessageId`
- 记忆提取：`{app="lilia", event=~"llm.extract.*"}`
- 提取结果摘要：`{app="lilia", event="llm.extract.complete"}`
- globalMax 前缀标记：`{app="lilia", event="llm.extract.mark"}`
- 按 job 过滤：`{app="lilia"} | json | jobId="<uuid>"`
- `LOG_TO_LOKI=false` 时只打 stdout，不推 Loki

`memory_jobs.snapshot` 仅保留 `messageIds` / `userId`；LLM 输入输出在 Loki（及 stdout）中查询。

### 4. 初始化数据库

空库按迁移建表并灌角色（详见下方「Prisma / 数据库」）：

```bash
pnpm exec prisma generate
pnpm exec prisma migrate deploy
pnpm exec prisma db seed
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
| `CHARACTER_CREATE_DAILY_LIMIT` | 每用户每天（UTC）新建角色次数上限 | 是 |

## 开发说明

- 本项目使用 **Next.js 16**，部分 API 与常见版本存在差异，编写代码前建议查阅 `node_modules/next/dist/docs/`。
- Prisma Client 输出到 `src/generated/prisma`（已 gitignore）。Prisma 7 的 `migrate` / `db push` / `db seed` **都不会**自动 `generate`；clone 或改 schema 后先执行 `pnpm exec prisma generate`。`seed` 会 import 该 Client，没 generate 会失败。

## Prisma / 数据库

迁移文件在 `prisma/migrations/`。本地调试可以先 `db push` 试 schema；**定稿后必须留下迁移**，生产只跑 `migrate deploy`。不要在生产使用 `db push`、`migrate dev` 或 `migrate reset`。

| 场景 | 命令 |
|------|------|
| 生成 Client | `pnpm exec prisma generate` |
| 本地反复改表（不写迁移） | `pnpm exec prisma db push` |
| 灌角色目录（幂等）；非 production 还会建用户 `tom` | `pnpm exec prisma db seed` |
| 生产 / 空库：执行尚未应用的迁移 | `pnpm exec prisma migrate deploy` |

**本地开发 → 准备上线：**

1. 开发中改 `prisma/schema.prisma` 后用 `pnpm exec prisma db push & generate`，不必每次都 `migrate dev`（避免堆半成品迁移）。

2. schema 确定、准备提交并上线时执行：

    ```bash
    # 清空本地库，按已有迁移文件重建并 seed（此时库 = 上一版迁移，不是 push 后的新表）
    pnpm exec prisma migrate reset

    # 对比「已有迁移叠起来的结果」和当前 schema.prisma，生成一条增量 SQL 并应用到本地库
    pnpm exec prisma migrate dev --name 简短说明
    ```

3. 生产：同步含新迁移的代码，必要时先停应用，然后执行：

    ```bash
    pnpm exec prisma generate
    pnpm exec prisma migrate deploy
    pnpm build
    sudo systemctl restart lilia
    ```

## 常用命令

```bash
pnpm dev          # 启动开发服务器
pnpm dev:all      # Next + extract/maintain Worker（需 Redis；一条命令）
pnpm build        # 构建生产版本
pnpm start        # 启动生产服务器
pnpm start:all    # 生产 Next + extract/maintain Worker（需先 build；需 Redis）
pnpm lint         # ESLint 检查
pnpm worker:memory-extract  # 记忆整理 Worker（需 Redis；另开终端）
pnpm worker:memory-maintain  # maintain→profile 闲置窗口（需 Redis；另开终端）
```