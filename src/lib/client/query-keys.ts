export const queryKeys = {
  authMe: ['auth', 'me'] as const,
  characters: ['characters'] as const,
  contacts: ['contacts'] as const,
  characterSession: (characterId: string) => ['contacts', characterId, 'session'] as const,
  messageHistory: (sessionId: string) => ['messages', sessionId, 'initial'] as const,
};
