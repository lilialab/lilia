# 画像维护 profile

← [返回总览](./pipeline.md)

```mermaid
flowchart TD
  API["POST memory/profile"] --> Entry[触发画像 job]
  Entry --> Core[画像 rollup 主流程]
  Core --> LoadStats[统计库内记忆分布]
  Core --> LoadProfile[并行加载画像与参考记忆]
  LoadStats --> Prompt[拼装 LLM prompt]
  LoadProfile --> Prompt
  Prompt --> LlmGen["LLM 生成 summary / facets"]
  LlmGen --> Upsert[upsert 用户画像]
```

## 功能与代码对应

| 功能 | 函数 |
|------|------|
| 画像 job 入口 | `runProfileRefresh` |
| 加载数据并调用 LLM rollup | `refreshUserProfile` |
| 记忆库 type 统计 | `loadMemoryStats` |
| 拼装刷新 prompt | `buildProfileRefreshPrompt` |
| 结构化 LLM 调用 | `generateText` |
