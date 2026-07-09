# 记忆维护 maintain

← [返回总览](./pipeline.md)

```mermaid
flowchart TD
  Start[维护 job 启动] --> GetWatermark[读取维护水位]
  GetWatermark --> Loop[串行消费游标队列]
  Loop --> FindCursor[取一条待维护游标]
  FindCursor --> One[维护单条游标]
  One --> Neighbors[Chroma 找语义近邻]
  Neighbors --> LoadIds[MySQL 加载近邻详情]
  LoadIds --> Branch{有近邻?}
  Branch -->|否| Touch["无近邻：1对1 touch"]
  Branch -->|是| LlmRewrite[有近邻：LLM 整理簇]
  LlmRewrite --> ParseValidate[解析校验 LLM 输出]
  ParseValidate -->|失败| Mark[仅标记已消费防重试]
  Touch --> Rewrite[删旧建新整簇]
  LlmRewrite -->|成功| Rewrite
  Rewrite --> Loop
  Mark --> Loop
  Loop --> UpdateWatermark[更新维护水位]
  UpdateWatermark --> Done[完成 job 写结果]
```

## 功能与代码对应

| 功能 | 函数 |
|------|------|
| 维护 job 主流程 | `runMaintenance`, `completeMaintenanceJob` |
| 读取 / 更新批级水位 | `getLastMaintainedAt`, `updateLastMaintainedAt` |
| 串行消费游标队列 | `runMaintenanceLoop`, `findNextUnmaintainedMemory` |
| 单条游标维护编排 | `maintainOneMemory` |
| 语义近邻召回与详情加载 | `findMemoryNeighbors`, `loadActiveMemoriesByIds` |
| 无近邻 touch（不调 LLM） | `buildCursorTouchMemories` |
| 有近邻时 LLM 整理 | `decideMaintenanceRewrite`, `buildMaintenancePrompt` |
| 解析 / 校验维护输出 | `mapMaintenanceRewriteOutput`, `validateMaintenanceRewriteOutput` |
| 确定删除范围（游标+近邻） | `buildMaintenanceClusterDeleteIds` |
| 删旧建新 | `applyClusterRewrite`, `applyMaintenanceMerge` |
| LLM 失败防重试 | `markMemoryMaintained` |
