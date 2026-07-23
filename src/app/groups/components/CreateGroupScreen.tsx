'use client';

import { type ContactSummary, fetchContacts } from '@/client-api/contacts';
import { createGroup } from '@/client-api/groups';
import { PageStatus } from '@/components/PageStatus';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { cn } from '@/lib/client/cn';
import { queryKeys } from '@/lib/client/query-keys';
import { formatClientError, showErrorToast } from '@/lib/client/show-error-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

/** 与 DEFAULT_CHARACTER_ID / seed slug 对齐；勿从 prompts/load 导入（含 fs）。 */
const DEFAULT_CHARACTER_SLUG = 'arbor';

function MemberPickerEmpty() {
  return (
    <p className={cn('px-4 py-4 text-sm text-zinc-400')}>
      通讯录加载异常，请返回后重试
    </p>
  );
}

type MemberPickerListProps = {
  contacts: ContactSummary[];
  selectedIds: Set<string>;
  onToggle: (contact: ContactSummary) => void;
};

function MemberPickerList({ contacts, selectedIds, onToggle }: MemberPickerListProps) {
  return (
    <section className={cn('bg-white')}>
      {contacts.map((contact) => {
        const isArbor = contact.slug === DEFAULT_CHARACTER_SLUG;
        const checked = selectedIds.has(contact.id);
        return (
          <label
            key={contact.id}
            className={cn(
              'flex items-center gap-3 border-b border-zinc-100 px-4 py-3',
              isArbor ? 'cursor-default' : 'cursor-pointer hover:bg-zinc-50',
            )}
          >
            <input
              type="checkbox"
              checked={checked}
              disabled={isArbor}
              onChange={() => onToggle(contact)}
              className={cn('h-4 w-4 rounded border-zinc-300')}
            />
            <span className={cn('text-sm text-zinc-900')}>
              {contact.displayName}
              {isArbor && (
                <span className={cn('ml-2 text-xs font-normal text-zinc-400')}>默认成员</span>
              )}
            </span>
          </label>
        );
      })}
    </section>
  );
}

export function CreateGroupScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isLoading: isAuthLoading, isUnauthenticated } = useRequireAuth();
  const [title, setTitle] = useState('');
  /** 用户可切换的成员；arbor 由下方 selectedIds 派生强制选中 */
  const [extraSelectedIds, setExtraSelectedIds] = useState<Set<string>>(new Set());

  const contactsQuery = useQuery({
    queryKey: queryKeys.contacts,
    queryFn: fetchContacts,
    enabled: Boolean(user),
  });

  const contacts = contactsQuery.data ?? [];
  const arborId = contacts.find((c) => c.slug === DEFAULT_CHARACTER_SLUG)?.id;
  const selectedIds = new Set(extraSelectedIds);
  if (arborId) selectedIds.add(arborId);

  const createMutation = useMutation({
    mutationFn: createGroup,
    onSuccess: async (group) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.groups });
      router.replace(`/groups/${group.id}`, { transitionTypes: ['nav-forward'] });
    },
    onError: (err) => {
      showErrorToast(formatClientError(err), 'group-create');
    },
  });

  if (isUnauthenticated) {
    return null;
  }

  const isBootstrapping = isAuthLoading || contactsQuery.isLoading;
  const canSubmit = title.trim().length > 0 && !createMutation.isPending;

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

  return (
    <div className={cn('flex h-dvh flex-col bg-zinc-50 text-zinc-900')}>
      <ScreenHeader
        title="新建群聊"
        onBack={() => router.push('/groups', { transitionTypes: ['nav-back'] })}
      />

      <PageStatus loading={isBootstrapping}>
        <form onSubmit={handleSubmit} className={cn('flex min-h-0 flex-1 flex-col')}>
          <div className={cn('shrink-0 border-b border-zinc-200 bg-white px-4 py-3')}>
            <label className={cn('block text-xs font-medium text-zinc-500')}>
              群名称
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="输入群名称"
                className={cn(
                  'mt-1.5 w-full rounded-md border border-zinc-300 px-3 py-2 text-base',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500',
                )}
                autoFocus
              />
            </label>
          </div>

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
              {createMutation.isPending ? '创建中...' : '创建并进入'}
            </button>
          </div>
        </form>
      </PageStatus>
    </div>
  );
}
