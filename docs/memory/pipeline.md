# 记忆流水线总览

- [对话记忆整理 extract](./extract.md)（行为说明见文档内 **「说明」**）
- [记忆维护 maintain](./maintain.md)（行为说明见文档内 **「说明」**）
- [画像维护 profile](./profile.md)

```mermaid
flowchart TB
  subgraph chat [Chat 实时路径]
    UserMsg[用户消息单聊] --> AssemblePrompt[组装 system prompt]
    UserMsg --> ScheduleExtract[滑动窗口入队 extract]
    UserMsg --> ScheduleMaintain["滑动窗口入队 maintain→profile（按 user×character）"]
    GroupMsg[用户消息群聊] --> AssembleGroupPrompt[组装群 system prompt]
    GroupMsg --> ScheduleGroupExtract[滑动窗口入队 extract 按 group]
    AssemblePrompt --> LoadProfile[读取当前角色画像]
    AssemblePrompt --> RagRecall[按输入检索当前角色记忆]
    AssembleGroupPrompt --> LoadProfile
    AssembleGroupPrompt --> RagRecall
    LoadProfile --> InjectPrompt[注入 prompt 第二层]
    RagRecall --> TouchActive[回写记忆活跃时间]
    TouchActive --> InjectPrompt
  end

  subgraph jobs [离线 Job]
    ScheduleExtract --> WorkerExtract["Worker runConsolidation 按 session 或 group"]
    ScheduleGroupExtract --> WorkerExtract
    ManualExtract["POST memory/consolidate"] --> RunExtract["本进程 runConsolidation"]
    WorkerExtract --> WriteMemory["写入 UserMemory；群聊全员扇出 + Chroma"]
    RunExtract --> WriteMemory
    ScheduleMaintain --> WorkerMaintain["Worker：闲置到期后管线"]
    WorkerMaintain -->|"距上次维护不足 min interval"| Reschedule[再 delay 到满冷却]
    WorkerMaintain -->|"可跑"| RunMaintain["runMaintenance（该角色）"]
    RunMaintain --> RunProfile["runProfileRefresh（该角色）"]
    ManualMaintain["POST memory/maintain?characterId="] --> RunMaintain
    ManualProfile["POST memory/profile?characterId="] --> RunProfile
    RunMaintain --> WriteMemory
    RunProfile --> UserProfile[(UserProfile)]
    UserProfile --> LoadProfile
  end
```

## 功能与代码对应

各 job 的选取规则、时间/衰减逻辑、落库约定见 [extract](./extract.md#说明) / [maintain](./maintain.md#说明) 的 **「说明」** 节。

| 功能 | 函数 |
|------|------|
| 组装 system prompt（人设 + 画像 + 记忆） | `buildSystemPrompt` / `buildGroupSystemPrompt`（人设 / jobs 文案：`src/prompts/`） |
| 读取并格式化用户画像 | `fetchUserProfile`, `getUserProfileText` |
| 语义检索 + 衰减重排 + 滤已删记忆 | `fetchMemoryFragmentsForPrompt`, `queryMemoryWithDecay`, `effectiveScore` |
| RAG 命中后刷新活跃时间 | `touchMemories` |
| extract 入队（单聊按 session 滑动窗口） | `scheduleMemoryExtract` |
| extract 入队（群聊按 groupSession；**不**入 maintain） | `scheduleGroupMemoryExtract` |
| maintain→profile 入队（按 user×character 滑动窗口；默认闲置 6h；仅单聊路径） | `scheduleMaintainPipeline` |
| 串行 maintain→profile；两者成功后写 `UserCharacter.lastMemoryPipelineAt` | `runMaintainPipelineForUserCharacter` |
| 冷却计时（距上次管线成功不足 min interval 则再推迟） | `getLastMemoryPipelineAt` |
| 对话记忆整理 job | `runConsolidation`（详见 [extract](./extract.md)） |
| 记忆维护 job | `runMaintenance`（详见 [maintain](./maintain.md)） |
| 画像 rollup job | `runProfileRefresh`（详见 [profile](./profile.md)） |

开发需另开：`pnpm worker:memory-extract`、`pnpm worker:memory-maintain`（Redis 已起）。
