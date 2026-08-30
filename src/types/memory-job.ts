import type { MemoryType } from '@/types/memory';

export type JobStatus = 'pending' | 'running' | 'completed' | 'failed';
export type JobKind = 'extract' | 'maintain' | 'profile';

export interface ExtractedMemory {
  text: string;
  type: MemoryType;
  confidence: number;
}

export interface ExtractJobResult {
  memoriesExtracted: number;
  memories: ExtractedMemory[];
  extractedMessageCount: number;
  unfinishedMessageCount: number;
}

export interface MaintainMergedGroup {
  newMemoryIds: string[];
  outputs: ExtractedMemory[];
  deletedIds: string[];
}

export interface MaintainJobResult {
  processedCount: number;
  mergedCount: number;
  deletedCount: number;
  mergedGroups: MaintainMergedGroup[];
  deletedIds: string[];
}

export interface ProfileJobResult {
  sourceVersion: number;
}

export interface MemoryJobRawPayload {
  model: string;
  system: string;
  prompt: string;
  response: string;
}

export interface MemoryJobSnapshot {
  messageIds?: string[];
  userId?: string;
  characterId?: string;
  sessionId?: string;
  groupSessionId?: string;
  rawPayload?: MemoryJobRawPayload;
}

export interface MemoryJob {
  id: string;
  kind: JobKind;
  status: JobStatus;
  startedAt: number;
  completedAt?: number;
  progress: string;
  result?: ExtractJobResult | MaintainJobResult | ProfileJobResult;
  error?: string;
  snapshot?: MemoryJobSnapshot;
}

export function isMaintainJobResult(
  result: MemoryJob['result'],
): result is MaintainJobResult {
  return result !== undefined && 'mergedCount' in result;
}

export function isProfileJobResult(result: MemoryJob['result']): result is ProfileJobResult {
  return result !== undefined && 'sourceVersion' in result && !('mergedCount' in result);
}
