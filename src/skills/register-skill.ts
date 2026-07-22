import { logger } from '@/lib/server/logger';
import { tool } from 'ai';
import { z } from 'zod';

/**
 * Meta-tool 占位：登记/创建新 skill（dynamic tool creation）。
 * 尚未落库或生成可执行工具；userId 预留给后续按用户隔离。
 */
export function createRegisterSkillTool(userId: string) {
  return tool({
    description: '登记或创建一个新的 skill（能力），供后续对话中调用。'
      + '能力边界（占位约定）：仅允许只读查询类能力；不可生成或执行任意代码；'
      + '新 skill 需经系统登记后方可使用。当前为未实现占位，调用只会得到 not_implemented 响应。',
    inputSchema: z.object({
      name: z
        .string()
        .trim()
        .min(1)
        .describe('新 skill 的稳定标识名，建议英文 camelCase，如 searchOrders'),
      description: z
        .string()
        .trim()
        .min(1)
        .describe('给模型看的 skill 说明：做什么、何时调用'),
      capabilityNotes: z
        .string()
        .trim()
        .optional()
        .describe('能力边界与限制说明，如只读、数据范围、禁止事项'),
    }),
    execute: async ({ name, description, capabilityNotes }) => {
      logger.info(
        {
          event: 'skills.registerSkill.placeholder',
          userId,
          name,
          description,
          capabilityNotes,
        },
        '[skills] registerSkill 占位被调用，尚未实现',
      );

      return {
        status: 'not_implemented' as const,
        message: 'registerSkill 仅为占位，尚未支持真正创建 skill。',
        requested: { name, description, capabilityNotes },
      };
    },
  });
}
