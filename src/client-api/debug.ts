import { apiFetchJson } from '@/lib/client/api-fetch';

export interface ExtractDebugFixture {
  id: string;
  label: string;
  messages: { speaker: string; text: string }[];
}

export interface ExtractDebugMeta {
  characters: string[];
  defaultCharacter: string;
  fixtures: ExtractDebugFixture[];
}

export interface ExtractPreviewResult {
  characterSlug: string;
  systemPrompt: string;
  userPrompt: string;
  transcript: string;
  messageIds: string[];
  rawText: string;
  error: string | undefined;
  memories: {
    text: string;
    type: string;
    confidence: number;
    sourceMessageIds: string[];
  }[];
  extractedIds: string[];
  deferredIds: string[];
  droppedInvalidIdTexts: string[];
}

/** 提取调试页：角色与夹具。 */
export function fetchExtractDebugMeta(): Promise<ExtractDebugMeta> {
  return apiFetchJson<ExtractDebugMeta>('/api/debug/extract');
}

/** 提取 dry-run。 */
export function previewExtract(input: {
  characterSlug: string;
  messages: { speaker: string; text: string }[];
}): Promise<ExtractPreviewResult> {
  return apiFetchJson<ExtractPreviewResult>('/api/debug/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export interface MaintainDebugFixture {
  id: string;
  label: string;
  cursor: { text: string; type: string; confidence: number };
  neighbors: { text: string; type: string; confidence: number; distance: number }[];
}

export interface MaintainDebugMeta {
  fixtures: MaintainDebugFixture[];
}

export interface MaintainPreviewResult {
  systemPrompt: string;
  userPrompt: string;
  rawText: string;
  error: string | undefined;
  memories: { text: string; type: string; confidence: number }[];
  inputCount: number;
}

/** 维护调试页：夹具。 */
export function fetchMaintainDebugMeta(): Promise<MaintainDebugMeta> {
  return apiFetchJson<MaintainDebugMeta>('/api/debug/maintain');
}

/** 维护 dry-run。 */
export function previewMaintain(input: {
  cursor: { text: string; type: string; confidence: number };
  neighbors: { text: string; type: string; confidence: number; distance: number }[];
}): Promise<MaintainPreviewResult> {
  return apiFetchJson<MaintainPreviewResult>('/api/debug/maintain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export interface ProfileDebugFixture {
  id: string;
  label: string;
  existing: { communication_style?: string; avoid_topics?: string[] };
  referenceMemories: { text: string; type: 'preference' | 'fact'; confidence: number }[];
}

export interface ProfileDebugMeta {
  characters: string[];
  defaultCharacter: string;
  fixtures: ProfileDebugFixture[];
}

export interface ProfilePreviewResult {
  characterSlug: string;
  systemPrompt: string;
  userPrompt: string;
  rawText: string;
  error: string | undefined;
  snapshot: { communication_style?: string; avoid_topics?: string[] } | undefined;
  unchanged: boolean;
}

/** 画像调试页：角色与夹具。 */
export function fetchProfileDebugMeta(): Promise<ProfileDebugMeta> {
  return apiFetchJson<ProfileDebugMeta>('/api/debug/profile');
}

/** 画像 dry-run。 */
export function previewProfile(input: {
  characterSlug: string;
  existing: Record<string, unknown>;
  referenceMemories: { text: string; type: string; confidence: number }[];
}): Promise<ProfilePreviewResult> {
  return apiFetchJson<ProfilePreviewResult>('/api/debug/profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}
