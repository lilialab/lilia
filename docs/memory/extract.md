# 对话记忆整理 extract

← [返回总览](./pipeline.md)

```mermaid
flowchart TD
  API["POST memory/consolidate"] --> CreateJob[创建整理任务]
  CreateJob --> MainFlow[整理主流程]
  MainFlow --> BuildTranscript[捞未整理消息拼 transcript]
  BuildTranscript --> LlmExtract[LLM 提炼长期记忆]
  LlmExtract --> ParseValidate[解析并校验 LLM 输出]
  ParseValidate --> MarkMessages["globalMax 前缀标记已整理消息"]
  MarkMessages --> Persist[事务写库]
  Persist --> SyncVector[同步向量库]
```

## 功能与代码对应

| 功能 | 函数 |
|------|------|
| 创建 job 并清理旧记录 | `prepareConsolidationJob` |
| 整理主流程编排 | `runConsolidation` |
| 构建待整理对话 transcript | `buildTranscript` |
| LLM 提取 finished_memories | `extractMemoriesFromTranscript` |
| 解析 / 校验 LLM 输出与 message id | `mapConsolidationOutput`, `validateAndMergeIds` |
| 落库：标记消息 + 新建记忆 | `persistConsolidation`, `buildUserMemoryWritePayload` |
| 向量库同步 | `syncUserMemoriesToChroma` |
