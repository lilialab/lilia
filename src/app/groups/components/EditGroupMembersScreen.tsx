'use client';

import {
  DEFAULT_CHARACTER_SLUG,
  MemberPickerEmpty,
  MemberPickerList,
} from '@/app/groups/components/MemberPicker';
import { type ContactSummary, fetchContacts } from '@/client-api/contacts';
import { fetchGroup, replaceGroupMembers } from '@/client-api/groups';
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

interface EditGroupMembersScreenProps {
  groupSessionId: string;
}

export function EditGroupMembersScreen({ groupSessionId }: EditGroupMembersScreenProps) {
  /* -------------------------------------------------------------------------- */
  /* State & data                                                               */
  /* -------------------------------------------------------------------------- */

  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const t = useTranslations('groupMembers');
  /** null = 尚未本地改动，勾选跟随群详情；非 null = 用户已编辑 */
  const [extraSelectedIds, setExtraSelectedIds] = useState<Set<string> | null>(null);

  const groupQuery = useQuery({
    queryKey: queryKeys.group(groupSessionId),
    queryFn: () => fetchGroup(groupSessionId),
    enabled: Boolean(user) && Boolean(groupSessionId),
  });

  const contactsQuery = useQuery({
    queryKey: queryKeys.contacts,
    queryFn: fetchContacts,
    enabled: Boolean(user),
  });

  const contacts = contactsQuery.data ?? [];
  const arborId = contacts.find((c) => c.slug === DEFAULT_CHARACTER_SLUG)?.id;
  const members = groupQuery.data?.members ?? [];

  const defaultExtraIds = new Set(
    members.filter((m) => m.slug !== DEFAULT_CHARACTER_SLUG).map((m) => m.id),
  );
  const effectiveExtraIds = extraSelectedIds ?? defaultExtraIds;
  const selectedIds = new Set(effectiveExtraIds);
  if (arborId) selectedIds.add(arborId);

  const goBackToChat = () => {
    router.push(`/groups/${groupSessionId}`, { transitionTypes: ['nav-back'] });
  };

  const saveMutation = useMutation({
    mutationFn: () => replaceGroupMembers(groupSessionId, { characterIds: [...selectedIds] }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.group(groupSessionId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.groups });
      goBackToChat();
    },
    onError: (err) => {
      showErrorToast(translateApiError(err), 'group-members-replace');
    },
  });

  const isBootstrapping = groupQuery.isLoading || contactsQuery.isLoading;
  const isLoadError = groupQuery.isError || contactsQuery.isError;
  const canSubmit = Boolean(groupQuery.data) && !saveMutation.isPending;

  /* -------------------------------------------------------------------------- */
  /* Handlers                                                                   */
  /* -------------------------------------------------------------------------- */

  const handleToggle = (contact: ContactSummary) => {
    if (contact.slug === DEFAULT_CHARACTER_SLUG) return;
    setExtraSelectedIds((prev) => {
      const base = prev ?? defaultExtraIds;
      const next = new Set(base);
      if (next.has(contact.id)) next.delete(contact.id);
      else next.add(contact.id);
      return next;
    });
  };

  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    saveMutation.mutate();
  };

  /* -------------------------------------------------------------------------- */
  /* Render                                                                     */
  /* -------------------------------------------------------------------------- */

  return (
    <div className={cn('flex h-dvh flex-col bg-surface text-foreground')}>
      <ScreenHeader title={t('title')} onBack={goBackToChat} />

      <PageStatus
        loading={isBootstrapping}
        error={isLoadError}
        errorMessage={t('loadError')}
        actionLabel={t('backToChat')}
        onAction={goBackToChat}
      >
        <form onSubmit={handleSubmit} className={cn('flex min-h-0 flex-1 flex-col')}>
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
              {saveMutation.isPending ? t('saving') : t('save')}
            </button>
          </div>
        </form>
      </PageStatus>
    </div>
  );
}
