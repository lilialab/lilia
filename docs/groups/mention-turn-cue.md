# 群聊 @ 与 turn_cue 续聊

群内 AI 互相点名、接力发言的前端编排 + 后端选角协议。

## 说明

- **谁决定召唤谁**：前端。从用户正文或助手正文解析第一个 `@slug`，写入消息 `metadata.slug`（及可选 `kind`）。
- **后端不猜 @**：只读最后一条 user 的 `metadata.kind` / `metadata.slug`，校验成员后选 speaker 流式回复。
- **turn_cue**：特殊用户消息（`kind: 'turn_cue'`），正文是系统触发语，**不进气泡列表**（`isDisplayMessage`）；**不进**历史分页（`getGroupHistoryPage`）与上下文窗口（`getGroupContextMessages`）；**本次召唤**仍把 cue 正文作为 ephemeral user 回合注入 LLM（否则对话以 assistant 结尾易空回复）；RAG 取上下文末条干净正文（用户句或上一助手句，见 `extractLatestContextTextForRag`）；进模型前再经 `withGroupSpeakerLabelsForModel` 加 `(slug):`。

### @slug 规则

正则：`/@([a-zA-Z0-9_-]+)/`，取**第一处**。

- 合法：`@arbor`、`@ai_bot-2`
- 中文等会截断或匹配失败：`@arbor你好` → `arbor`；`@阿尔博` → 无 slug

实现：`GroupChatScreen.utils.ts` 内私有 `extractFirstMentionSlug`。

## 流程

```mermaid
sequenceDiagram
  participant User as 用户
  participant UI as GroupChatScreen
  participant Cue as sendTurnCueIfMentioned
  participant API as POST /api/groups/:id/chat
  participant Svc as streamGroupChatFlow

  User->>UI: 发送（可含 @slug）
  UI->>UI: buildUserOutboundMetadata(text)
  UI->>API: user 消息 metadata.kind=null, slug=?
  API->>Svc: 按 slug 选成员（无则默认 arbor）
  Svc-->>UI: 助手流式回复

  UI->>Cue: onFinish(assistant)
  Cue->>Cue: 正文抽 @ 且须为群成员
  alt 有效 @
    Cue->>API: turn_cue 用户消息（kind+slug+触发语文案）
    API->>Svc: 强制该 slug 发言；RAG 用上下文末条（上一助手句）
    Svc-->>UI: 被 @ 角色流式回复
  else 无有效 @
    Cue-->>UI: noop（对话停）
  end
```

### 1. 用户主动发送

| 步骤 | 行为 |
|------|------|
| 组 metadata | `buildUserOutboundMetadata(text)` → `{ kind: null, slug }` |
| 后端 | `slug` 命中群成员则该角色答；否则默认 `arbor`（群内必须有 arbor） |
| RAG | 用本条用户正文 |

### 2. 助手结束后自动续聊

| 步骤 | 行为 |
|------|------|
| 触发 | `useChat` `onFinish`，且非 abort/error，role=assistant |
| 编排 | `sendTurnCueIfMentioned({ assistantParts, members, sendMessage })` |
| 条件 | 正文有 `@slug` **且** `members` 含该 slug，否则 noop |
| 发出 | `kind: turn_cue`，`slug`，正文 `【系统】你（@slug）被点名…` |
| 后端 | 必须带 slug；speaker 固定为该成员；RAG 取上下文末条助手正文 |

可多轮接力：A @ B → turn_cue → B 回复再 @ C → 再 cue，直到某次回复没有有效群内 @，或自动续聊达到 **5** 轮上限（前端熔断，触顶 toast「续聊轮次已达上限」）。

## 代码入口

| 层级 | 路径 |
|------|------|
| 前端编排 | `src/app/groups/components/GroupChatScreen.tsx`（`onFinish` / 用户提交） |
| @ / turn_cue 工具 | `src/app/groups/components/GroupChatScreen.utils.ts` |
| 单测 | `tests/app/groups/GroupChatScreen.utils.test.ts` |
| metadata / 展示过滤 | `src/types/message-kind.ts`（`MESSAGE_KIND_TURN_CUE`、`isDisplayMessage`） |
| API body | `src/schemas/api/groups/chat-post.ts` |
| 选角 + 流 | `src/services/group/group-chat.service.ts`（`streamGroupChatFlow`） |
| 落库 / 历史与上下文排除 cue / 说话人前缀与 RAG 句 | `group-message.service` + `group-message.utils` |

## 注意

- 前端解析 @ 给**出站 metadata**；助手气泡里的 `@xxx` 仍是模型自由文本，靠 prompt 约束，不是第二套后端解析。
- turn_cue 会出现在 `useChat` 的 `messages` 里（供链路与 loading），但 UI 列表应过滤掉。
- 改触发语文案只动 `buildTurnCueText`（utils 内私有）；改匹配规则动 `extractFirstMentionSlug`。
