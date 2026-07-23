'use client';

import {
  DEFAULT_CHARACTER_SLUG,
  MemberPickerEmpty,
  MemberPickerList,
} from '@/app/groups/components/MemberPicker';
import { type ContactSummary, fetchContacts } from '@/client-api/contacts';
import { fetchGroup, replaceGroupMembers } from '@/client-api/groups';
import { PageStatus } from '@/components/PageStatus';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { cn } from '@/lib/client/cn';
import { queryKeys } from '@/lib/client/query-keys';
import { formatClientError, showErrorToast } from '@/lib/client/show-error-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface EditGroupMembersScreenProps {
  groupSessionId: string;
}

export function EditGroupMembersScreen({ groupSessionId }: EditGroupMembersScreenProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isLoading: isAuthLoading, isUnauthenticated } = useRequireAuth();
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
      showErrorToast(formatClientError(err), 'group-members-replace');
    },
  });

  if (isUnauthenticated) {
    return null;
  }

  const isBootstrapping = isAuthLoading || groupQuery.isLoading || contactsQuery.isLoading;
  const isLoadError = groupQuery.isError || contactsQuery.isError;
  const canSubmit = Boolean(groupQuery.data) && !saveMutation.isPending;

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

  return (
    <div className={cn('flex h-dvh flex-col bg-zinc-50 text-zinc-900')}>
      <ScreenHeader title="管理成员" onBack={goBackToChat} />

      <PageStatus
        loading={isBootstrapping}
        error={isLoadError}
        errorMessage="无法加载群成员"
        actionLabel="返回群聊"
        onAction={goBackToChat}
      >
        <form onSubmit={handleSubmit} className={cn('flex min-h-0 flex-1 flex-col')}>
          <div className={cn('min-h-0 flex-1 overflow-y-auto')}>
            <h2 className={cn('px-4 py-2 text-xs font-medium text-zinc-500')}>选择成员</h2>
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
              'shrink-0 border-t border-zinc-200 bg-white p-3',
              'pb-[max(0.75rem,env(safe-area-inset-bottom))]',
            )}
          >
            <button
              type="submit"
              disabled={!canSubmit}
              className={cn(
                'w-full rounded-md bg-blue-600 py-2.5 text-sm font-medium text-white',
                'hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40',
              )}
            >
              {saveMutation.isPending ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </PageStatus>
    </div>
  );
}
