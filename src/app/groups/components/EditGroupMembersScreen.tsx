'use client';

import { MemberPickerEmpty, MemberPickerList } from '@/app/groups/components/MemberPicker';
import { type ContactSummary, fetchContacts } from '@/client-api/contacts';
import { fetchGroup, replaceGroupMembers } from '@/client-api/groups';
import { Form } from '@/components/Form';
import { useTranslations } from '@/components/I18nProvider';
import { PageStatus } from '@/components/PageStatus';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useRequiredUser } from '@/hooks/useRequiredUser';
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
  const user = useRequiredUser();
  const t = useTranslations('groupMembers');
  /** null = 尚未本地改动，勾选跟随群详情；非 null = 用户已编辑 */
  const [editedIds, setEditedIds] = useState<Set<string> | null>(null);

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
  const members = groupQuery.data?.members ?? [];
  const memberIds = new Set(members.map((m) => m.id));
  const selectedIds = editedIds ?? memberIds;

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
  const canSubmit = Boolean(groupQuery.data) && selectedIds.size > 0 && !saveMutation.isPending;

  /* -------------------------------------------------------------------------- */
  /* Handlers                                                                   */
  /* -------------------------------------------------------------------------- */

  const handleToggle = (contact: ContactSummary) => {
    setEditedIds((prev) => {
      const base = prev ?? memberIds;
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
        <Form onSubmit={handleSubmit} className={cn('flex min-h-0 flex-1 flex-col')}>
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
            <Form.Submit disabled={!canSubmit}>
              {saveMutation.isPending ? t('saving') : t('save')}
            </Form.Submit>
          </div>
        </Form>
      </PageStatus>
    </div>
  );
}
