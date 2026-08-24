'use client';

import { fetchUserLlmConfig, updateUserLlmConfig } from '@/client-api/llm-config';
import { AuthField } from '@/components/auth';
import { useTranslations } from '@/components/I18nProvider';
import { ScreenHeader } from '@/components/ScreenHeader';
import { translateApiError } from '@/i18n/client';
import { cn } from '@/lib/client/cn';
import { queryKeys } from '@/lib/client/query-keys';
import { showErrorToast, showSuccessToast } from '@/lib/client/toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function LlmConfigScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations('llmConfig');
  const tCommon = useTranslations('common');

  /* -------------------------------------------------------------------------- */
  /* State & data                                                               */
  /* -------------------------------------------------------------------------- */

  const configQuery = useQuery({
    queryKey: queryKeys.llmConfig,
    queryFn: fetchUserLlmConfig,
    gcTime: 0,
    meta: { showErrorToast: false },
  });
  const config = configQuery.data;
  const [draftBaseUrl, setDraftBaseUrl] = useState<string | null>(null);
  const [draftModel, setDraftModel] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const baseUrl = draftBaseUrl ?? config?.baseUrl ?? '';
  const model = draftModel ?? config?.model ?? '';
  const isBusy = isSaving || isClearing;
  const hasStoredConfig = Boolean(config?.baseUrl || config?.model || config?.hasApiKey);

  /* -------------------------------------------------------------------------- */
  /* Handlers                                                                   */
  /* -------------------------------------------------------------------------- */

  const persist = async (input: { baseUrl: string; model: string; apiKey: string }) => {
    const next = await updateUserLlmConfig(input);
    queryClient.setQueryData(queryKeys.llmConfig, next);
    setDraftBaseUrl(null);
    setDraftModel(null);
    setApiKey('');
  };

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await persist({ baseUrl, model, apiKey });
      showSuccessToast(t('success'), 'llm-config');
    } catch (err) {
      showErrorToast(translateApiError(err), 'llm-config');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = async () => {
    setIsClearing(true);
    try {
      await persist({ baseUrl: '', model: '', apiKey: '' });
      showSuccessToast(t('clearSuccess'), 'llm-config');
    } catch (err) {
      showErrorToast(translateApiError(err), 'llm-config');
    } finally {
      setIsClearing(false);
    }
  };

  /* -------------------------------------------------------------------------- */
  /* Render                                                                     */
  /* -------------------------------------------------------------------------- */

  return (
    <div className={cn('flex h-full flex-col bg-surface text-foreground')}>
      <ScreenHeader
        title={t('title')}
        onBack={() => router.push('/me/settings', { transitionTypes: ['nav-back'] })}
      />

      <div className={cn('flex-1 overflow-y-auto px-4 py-4')}>
        {configQuery.isLoading && (
          <p className={cn('text-sm text-muted-foreground')}>{tCommon('loading')}</p>
        )}
        {configQuery.isError && <p className={cn('text-sm text-destructive')}>{t('loadError')}</p>}
        {config && (
          <form onSubmit={handleSubmit} className={cn('flex flex-col gap-4')}>
            <p className={cn('text-sm text-muted-foreground')}>{t('hint')}</p>
            <p className={cn('text-sm text-foreground/80')}>
              {config.baseUrl?.trim() && config.model?.trim() && config.hasApiKey
                ? t('statusEnabled')
                : t('statusDisabled')}
            </p>
            <AuthField
              id="llmBaseUrl"
              label={t('baseUrl')}
              value={baseUrl}
              onChange={setDraftBaseUrl}
              autoComplete="off"
            />
            <AuthField
              id="llmModel"
              label={t('model')}
              value={model}
              onChange={setDraftModel}
              autoComplete="off"
            />
            <AuthField
              id="llmApiKey"
              label={t('apiKey')}
              type="password"
              value={apiKey}
              onChange={setApiKey}
              autoComplete="off"
              placeholder={config.hasApiKey ? t('apiKeyConfigured') : undefined}
            />
            <button
              type="submit"
              disabled={isBusy}
              className={cn(
                'mt-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground',
                'hover:bg-primary-hover disabled:opacity-40',
              )}
            >
              {isSaving ? t('submitting') : t('submit')}
            </button>
            {hasStoredConfig && (
              <button
                type="button"
                disabled={isBusy}
                onClick={handleClear}
                className={cn(
                  'rounded-md border border-border px-4 py-2.5 text-sm font-medium text-foreground',
                  'hover:bg-surface disabled:opacity-40',
                )}
              >
                {isClearing ? t('clearing') : t('clear')}
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
