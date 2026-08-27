# 画像维护 profile

← [返回总览](./pipeline.md)

```mermaid
flowchart TD
  API["POST memory/profile?characterId="] --> Entry[触发画像 job]
  Pipeline["maintain→profile 管线"] --> Entry
  Entry --> Core[画像 rollup 主流程]
  Core --> LoadProfile[并行加载该角色画像与非 event 参考记忆]
  LoadProfile --> Prompt[拼装 LLM prompt]
  Prompt --> LlmGen["LLM 生成 nickname / communication_style / avoid_topics 文本"]
  LlmGen --> Upsert["upsert UserProfile.text"]
```

## 说明

### 目的

按 **userId + characterId** 私有：从该角色下的长期记忆 rollup 出用户画像（称呼、说话方式、回避话题），供该角色单聊 / 群聊每次注入 prompt。职业、日程、兴趣等生平不写入画像，由 RAG 按需检索。

### 何时触发

- **管线**：某角色 maintain 成功后串行跑该角色 profile（见 [pipeline](./pipeline.md)）
- **立即触发（测试）**：`POST /api/memory/profile?username=&characterId=`；须为通讯录好友；本进程异步跑，返回 `jobId`

### 参考记忆

- 仅该角色 `isDeleted=false` 且 `type != event` 的记忆
- 按 confidence / lastActiveAt 取 top `MEMORY_PROFILE_REFERENCE_LIMIT`

删通讯录**不删**画像（与记忆一致，加回好友可继续用）。

## 功能与代码对应

| 功能 | 函数 |
|------|------|
| 画像 job 入口 | `runProfileRefresh` |
| 加载数据并调用 LLM rollup | `refreshUserProfile` |
| 拼装刷新 prompt | `buildProfileRefreshPrompt` |
| 读画像注入 prompt | `getUserProfileText` |
| LLM 调用 | `generateText` |
