# 记忆流水线总览

- [对话记忆整理 extract](./extract.md)（行为说明见文档内 **「说明」**）
- [记忆维护 maintain](./maintain.md)（行为说明见文档内 **「说明」**）
- [画像维护 profile](./profile.md)

```mermaid
flowchart TB
  subgraph chat [Chat 实时路径]
    UserMsg[用户消息] --> AssemblePrompt[组装 system prompt]
    AssemblePrompt --> LoadProfile[读取用户画像]
    AssemblePrompt --> RagRecall[按输入检索相关记忆]
    LoadProfile --> InjectPrompt[注入 prompt 第二层]
    RagRecall --> TouchActive[回写记忆活跃时间]
    TouchActive --> InjectPrompt
  end

  subgraph jobs [离线 Job 手动触发]
    CompleteSession["POST sessions/complete 完结话题"] --> TriggerExtract["POST memory/consolidate 触发整理"]
    TriggerExtract --> WriteMemory[(写入 UserMemory + Chroma)]
    WriteMemory --> RunMaintain[记忆去重整理]
    WriteMemory --> RunProfile[画像 rollup]
    RunMaintain --> WriteMemory
    RunProfile --> UserProfile[(UserProfile)]
    UserProfile --> LoadProfile
  end
```

## 功能与代码对应

各 job 的选取规则、时间/衰减逻辑、落库约定见 [extract](./extract.md#说明) / [maintain](./maintain.md#说明) 的 **「说明」** 节。

| 功能 | 函数 |
|------|------|
| 组装 system prompt（人设 + 画像 + 记忆） | `buildSystemPrompt` |
| 读取并格式化用户画像 | `fetchUserProfile`, `getUserProfileText` |
| 语义检索 + 衰减重排 + 滤已删记忆 | `fetchHistoricalContext`, `queryMemoryWithDecay`, `effectiveScore` |
| RAG 命中后刷新活跃时间 | `touchMemories` |
| 对话记忆整理 job | `runConsolidation`（详见 [extract](./extract.md)） |
| 记忆维护 job | `runMaintenance`（详见 [maintain](./maintain.md)） |
| 画像 rollup job | `runProfileRefresh`（详见 [profile](./profile.md)） |
