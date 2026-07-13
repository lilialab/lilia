export const queryKeys = {
  authMe: ['auth', 'me'] as const,
  defaultSession: ['session', 'default'] as const,
  messageHistory: (sessionId: string) => ['messages', sessionId, 'initial'] as const,
};
