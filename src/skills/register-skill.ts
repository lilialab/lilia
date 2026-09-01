import { logger } from '@/lib/server/logger';
import { tool } from 'ai';
import { z } from 'zod';

/**
 * Meta-tool 占位：登记/创建新 skill（dynamic tool creation）。
 * 尚未落库或生成可执行工具；userId 预留给后续按用户隔离。
 */
export function createRegisterSkillTool(userId: string) {
  return tool({
    description:
      'Register a new skill for later turns. This is a placeholder: it does not create a real tool. When implemented, only read-only lookups will be allowed—no generating or running arbitrary code. Calling it now returns not_implemented.',
    inputSchema: z.object({
      name: z
        .string()
        .trim()
        .min(1)
        .describe('Stable skill id. Prefer English camelCase, e.g. searchOrders'),
      description: z
        .string()
        .trim()
        .min(1)
        .describe('What the skill does and when to call it'),
      capabilityNotes: z
        .string()
        .trim()
        .optional()
        .describe('Limits, e.g. read-only, data scope, things it must not do'),
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
        message: 'registerSkill is a placeholder and cannot create skills yet.',
        requested: { name, description, capabilityNotes },
      };
    },
  });
}
