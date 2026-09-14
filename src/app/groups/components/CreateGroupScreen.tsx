'use client';

import { MemberPickerEmpty, MemberPickerList } from '@/app/groups/components/MemberPicker';
import { type ContactSummary, fetchContacts } from '@/client-api/contacts';
import { createGroup } from '@/client-api/groups';
import { Form } from '@/components/Form';
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const contactsQuery = useQuery({
    queryKey: queryKeys.contacts,
    queryFn: fetchContacts,
    enabled: Boolean(user),
  });

  const contacts = contactsQuery.data ?? [];

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
  const canSubmit = title.trim().length > 0 && selectedIds.size > 0 && !createMutation.isPending;

  /* -------------------------------------------------------------------------- */
  /* Handlers                                                                   */
  /* -------------------------------------------------------------------------- */

  const handleToggle = (contact: ContactSummary) => {
    setSelectedIds((prev) => {
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
        <Form onSubmit={handleSubmit} className={cn('flex min-h-0 flex-1 flex-col')}>
          <div className={cn('shrink-0 border-b border-border bg-background px-4 py-3')}>
            <Form.Field label={t('nameLabel')}>
              <Form.Input
                value={title}
                onChange={setTitle}
                placeholder={t('namePlaceholder')}
                autoFocus
              />
            </Form.Field>
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
            <Form.Submit disabled={!canSubmit}>
              {createMutation.isPending ? t('creating') : t('createAndEnter')}
            </Form.Submit>
          </div>
        </Form>
      </PageStatus>
    </div>
  );
}
