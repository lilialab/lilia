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
  consolidatedMessageCount: number;
  unfinishedMessageCount: number;
}

export interface MaintenanceMergedGroup {
  newMemoryIds: string[];
  outputs: ExtractedMemory[];
  deletedIds: string[];
}

export interface MaintenanceJobResult {
  processedCount: number;
  mergedCount: number;
  deletedCount: number;
  mergedGroups: MaintenanceMergedGroup[];
  deletedIds: string[];
}

export interface ProfileJobResult {
  sourceVersion: number;
}

export interface ConsolidationJobRawPayload {
  model: string;
  system: string;
  prompt: string;
  response: string;
}

export interface ConsolidationJobSnapshot {
  messageIds?: string[];
  userId?: string;
  sessionId?: string;
  rawPayload?: ConsolidationJobRawPayload;
}

export interface ConsolidationJob {
  id: string;
  kind: JobKind;
  status: JobStatus;
  startedAt: number;
  completedAt?: number;
  progress: string;
  result?: ExtractJobResult | MaintenanceJobResult | ProfileJobResult;
  error?: string;
  snapshot?: ConsolidationJobSnapshot;
}

export function isMaintenanceJobResult(
  result: ConsolidationJob['result'],
): result is MaintenanceJobResult {
  return result !== undefined && 'mergedCount' in result;
}

export function isProfileJobResult(
  result: ConsolidationJob['result'],
): result is ProfileJobResult {
  return result !== undefined && 'sourceVersion' in result && !('mergedCount' in result);
}
