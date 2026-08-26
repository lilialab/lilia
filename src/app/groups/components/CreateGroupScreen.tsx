'use client';

import {
  DEFAULT_CHARACTER_SLUG,
  MemberPickerEmpty,
  MemberPickerList,
} from '@/app/groups/components/MemberPicker';
import { type ContactSummary, fetchContacts } from '@/client-api/contacts';
import { createGroup } from '@/client-api/groups';
import { useTranslations } from '@/components/I18nProvider';
import { PageStatus } from '@/components/PageStatus';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useAuth } from '@/hooks/useAuth';
import { translateApiError } from '@/i18n/client';
import { cn } from '@/lib/client/cn';
import { queryKeys } from '@/lib/client/query-keys';
import { showErrorToast } from '@/lib/client/toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function CreateGroupScreen() {
  /* -------------------------------------------------------------------------- */
  /* State & data                                                               */
  /* -------------------------------------------------------------------------- */

  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const t = useTranslations('createGroup');
  const [title, setTitle] = useState('');
  /** 用户可切换的成员；默认角色由下方 selectedIds 派生强制选中 */
  const [extraSelectedIds, setExtraSelectedIds] = useState<Set<string>>(new Set());

  const contactsQuery = useQuery({
    queryKey: queryKeys.contacts,
    queryFn: fetchContacts,
    enabled: Boolean(user),
  });

  const contacts = contactsQuery.data ?? [];
  const defaultCharacterId = contacts.find((c) => c.slug === DEFAULT_CHARACTER_SLUG)?.id;
  const selectedIds = new Set(extraSelectedIds);
  if (defaultCharacterId) selectedIds.add(defaultCharacterId);

  const createMutation = useMutation({
    mutationFn: createGroup,
    onSuccess: async (group) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.groups });
      router.replace(`/groups/${group.id}`, { transitionTypes: ['nav-forward'] });
    },
    onError: (err) => {
      showErrorToast(translateApiError(err), 'group-create');
    },
  });

  const isBootstrapping = contactsQuery.isLoading;
  const canSubmit = title.trim().length > 0 && !createMutation.isPending;

  /* -------------------------------------------------------------------------- */
  /* Handlers                                                                   */
  /* -------------------------------------------------------------------------- */

  const handleToggle = (contact: ContactSummary) => {
    if (contact.slug === DEFAULT_CHARACTER_SLUG) return;
    setExtraSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(contact.id)) next.delete(contact.id);
      else next.add(contact.id);
      return next;
    });
  };

  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    createMutation.mutate({
      title: title.trim(),
      characterIds: [...selectedIds],
    });
  };

  /* -------------------------------------------------------------------------- */
  /* Render                                                                     */
  /* -------------------------------------------------------------------------- */

  return (
    <div className={cn('flex h-dvh flex-col bg-surface text-foreground')}>
      <ScreenHeader
        title={t('title')}
        onBack={() => router.push('/groups', { transitionTypes: ['nav-back'] })}
      />

      <PageStatus loading={isBootstrapping}>
        <form onSubmit={handleSubmit} className={cn('flex min-h-0 flex-1 flex-col')}>
          <div className={cn('shrink-0 border-b border-border bg-background px-4 py-3')}>
            <label className={cn('block text-xs font-medium text-muted-foreground')}>
              {t('nameLabel')}
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('namePlaceholder')}
                className={cn(
                  'mt-1.5 w-full rounded-md border border-border px-3 py-2 text-base text-foreground',
                  'outline-none focus:border-muted-foreground',
                )}
                autoFocus
              />
            </label>
          </div>

          <div className={cn('min-h-0 flex-1 overflow-y-auto')}>
            <h2 className={cn('px-4 py-2 text-xs font-medium text-muted-foreground')}>
              {t('selectMembers')}
            </h2>
            {contacts.length === 0 ? <MemberPickerEmpty /> : (
              <MemberPickerList
                contacts={contacts}
                selectedIds={selectedIds}
                onToggle={handleToggle}
              />
            )}
          </div>

          <div
            className={cn(
              'shrink-0 border-t border-border bg-background p-3',
              'pb-[max(0.75rem,env(safe-area-inset-bottom))]',
            )}
          >
            <button
              type="submit"
              disabled={!canSubmit}
              className={cn(
                'w-full rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground',
                'hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40',
              )}
            >
              {createMutation.isPending ? t('creating') : t('createAndEnter')}
            </button>
          </div>
        </form>
      </PageStatus>
    </div>
  );
}
