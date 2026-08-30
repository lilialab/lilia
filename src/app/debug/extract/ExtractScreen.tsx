'use client';

import {
  type ExtractPreviewResult,
  fetchExtractDebugMeta,
  previewExtract,
} from '@/client-api/debug';
import { ScreenHeader } from '@/components/ScreenHeader';
import { translateApiError } from '@/i18n/client';
import { cn } from '@/lib/client/cn';
import { queryKeys } from '@/lib/client/query-keys';
import { showErrorToast } from '@/lib/client/toast';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface ResultBlockProps {
  title: string;
  body: string;
}

function ResultBlock({ title, body }: ResultBlockProps) {
  return (
    <section className={cn('flex flex-col gap-1')}>
      <h2 className={cn('text-xs font-medium text-muted-foreground')}>{title}</h2>
      <pre
        className={cn(
          'max-h-80 overflow-auto whitespace-pre-wrap break-all rounded-md border border-border',
          'bg-background p-3 text-xs',
        )}
      >
        {body}
      </pre>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* State & data                                                               */
/* -------------------------------------------------------------------------- */

export function ExtractScreen() {
  const router = useRouter();
  const metaQuery = useQuery({
    queryKey: queryKeys.debugExtractMeta,
    queryFn: fetchExtractDebugMeta,
    retry: false,
    meta: { showErrorToast: false },
  });

  const [characterSlug, setCharacterSlug] = useState<string | undefined>();
  const [fixtureId, setFixtureId] = useState<string | undefined>();
  const [result, setResult] = useState<ExtractPreviewResult | undefined>();

  const meta = metaQuery.data;
  const resolvedCharacter = characterSlug ?? meta?.defaultCharacter ?? '';
  const defaultFixture = meta?.fixtures[0];
  const resolvedFixtureId = fixtureId ?? defaultFixture?.id ?? '';
  const selectedFixture = (meta?.fixtures ?? []).find((item) => item.id === resolvedFixtureId)
    ?? defaultFixture;
  const fixtureJson = selectedFixture
    ? JSON.stringify(selectedFixture.messages, null, 2)
    : '';

  const runMutation = useMutation({
    mutationFn: previewExtract,
    onSuccess: (data) => {
      setResult(data);
      if (data.error) {
        showErrorToast(data.error, 'debug-extract');
      }
    },
    onError: (err) => {
      showErrorToast(translateApiError(err), 'debug-extract');
    },
  });

  /* -------------------------------------------------------------------------- */
  /* Handlers                                                                   */
  /* -------------------------------------------------------------------------- */

  const handleRun = () => {
    if (!selectedFixture) {
      showErrorToast('请选择夹具', 'debug-extract');
      return;
    }
    runMutation.mutate({
      characterSlug: resolvedCharacter,
      messages: selectedFixture.messages,
    });
  };

  /* -------------------------------------------------------------------------- */
  /* Render                                                                     */
  /* -------------------------------------------------------------------------- */

  return (
    <div className={cn('flex min-h-full flex-col')}>
      <ScreenHeader title="记忆提取" onBack={() => router.push('/debug')} />

      <div className={cn('mx-auto flex w-full max-w-3xl flex-col gap-4 p-4')}>
        {metaQuery.isError && (
          <p className={cn('text-sm text-destructive')}>
            无法加载调试元数据（确认 NODE_ENV=development）
          </p>
        )}

        <label className={cn('flex flex-col gap-1 text-sm')}>
          角色
          <select
            className={cn('rounded-md border border-border bg-background px-2 py-1.5')}
            value={resolvedCharacter}
            onChange={(event) => setCharacterSlug(event.target.value)}
          >
            {(meta?.characters ?? []).map((slug) => (
              <option key={slug} value={slug}>
                {slug}
              </option>
            ))}
          </select>
        </label>

        <label className={cn('flex flex-col gap-1 text-sm')}>
          夹具
          <select
            className={cn('rounded-md border border-border bg-background px-2 py-1.5')}
            value={resolvedFixtureId}
            onChange={(event) => setFixtureId(event.target.value)}
          >
            {(meta?.fixtures ?? []).map((fixture) => (
              <option key={fixture.id} value={fixture.id}>
                {fixture.label}
              </option>
            ))}
          </select>
        </label>

        <ResultBlock title="messages" body={fixtureJson || '（无夹具）'} />

        <button
          type="button"
          disabled={runMutation.isPending}
          onClick={handleRun}
          className={cn(
            'rounded-md bg-foreground px-3 py-2 text-sm text-background',
            'disabled:opacity-40',
          )}
        >
          {runMutation.isPending ? '提取中…' : '运行提取'}
        </button>

        {result && (
          <div className={cn('flex flex-col gap-4 pb-8')}>
            {result.error && <p className={cn('text-sm text-destructive')}>{result.error}</p>}
            <ResultBlock title="system" body={result.systemPrompt} />
            <ResultBlock title="conversation" body={result.userPrompt} />
            <ResultBlock title="模型原文" body={result.rawText || '（空）'} />
            <ResultBlock
              title="解析后的记忆"
              body={JSON.stringify(
                {
                  memories: result.memories,
                  extractedIds: result.extractedIds,
                  deferredIds: result.deferredIds,
                  droppedInvalidIdTexts: result.droppedInvalidIdTexts,
                },
                null,
                2,
              )}
            />
          </div>
        )}
      </div>
    </div>
  );
}
