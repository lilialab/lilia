import type { ToolSet } from 'ai';
import { logger } from '@/lib/server/logger';
import { createRegisterSkillTool } from './register-skill';
import { createSearchChatHistoryTool } from './search-chat-history';

export type SkillContext = {
  userId: string;
  characterSlug: string;
};

/**
 * 按角色配置的 skill id 装配 AI SDK tools。
 * 未知 id 会打日志并跳过。
 */
export function resolveToolsForCharacter(skills: string[], context: SkillContext): ToolSet {
  const tools: ToolSet = {};

  for (const skillId of skills) {
    switch (skillId) {
      case 'searchChatHistory': {
        tools.searchChatHistory = createSearchChatHistoryTool(
          context.userId,
          context.characterSlug,
        );
        break;
      }
      case 'registerSkill': {
        // meta-tool 占位：角色 meta.skills 加上 "registerSkill" 即可启用
        tools.registerSkill = createRegisterSkillTool(context.userId);
        break;
      }
      default: {
        logger.warn({ skillId }, '[skills] 未知 skill，已跳过');
      }
    }
  }

  return tools;
}
