export type PromptSkill = 'chat_mode' | 'goal_mode' | 'general';

const PROMPT_SKILLS: Record<PromptSkill, string> = {
  chat_mode: `
    ## 当前运行模式：[深度倾听模式]
    - 优先进行情绪共情，绝对不要急于给出硬性的解决方案或讲大道理。
    - 鼓励用户多表达内心的真实感受。
  `,

  goal_mode: `
    ## 当前运行模式：[军师/目标追踪模式]
    - 协助用户梳理行动计划，将大目标拆解为可执行的微小步骤。
    - 语气要坚定、积极、充满行动力。
  `,

  general: `## 当前运行模式：[日常闲聊模式]`,
};

export function routeSkill(content: string): { skill: PromptSkill; block: string } {
  if (content.includes('难过') || content.includes('累')) {
    return { skill: 'chat_mode', block: PROMPT_SKILLS.chat_mode };
  }
  if (content.includes('计划') || content.includes('目标')) {
    return { skill: 'goal_mode', block: PROMPT_SKILLS.goal_mode };
  }
  return { skill: 'general', block: PROMPT_SKILLS.general };
}
