'use client';

import { type ContactSummary, fetchContacts } from '@/client-api/contacts';
import { PageStatus } from '@/components/PageStatus';
import { HeaderIconButton, ScreenHeader } from '@/components/ScreenHeader';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/client/cn';
import { queryKeys } from '@/lib/client/query-keys';
import { useQuery } from '@tanstack/react-query';
import { UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';

function ContactsEmpty() {
  return <p className={cn('px-4 py-6 text-sm text-zinc-400')}>还没有 AI 好友，点右上角添加</p>;
}

interface ContactsListProps {
  contacts: ContactSummary[];
}

function ContactsList({ contacts }: ContactsListProps) {
  const router = useRouter();

  return (
    <ul>
      {contacts.map((contact) => (
        <li key={contact.id}>
          <button
            type="button"
            onClick={() => router.push(`/chat/${contact.id}`, { transitionTypes: ['nav-forward'] })}
            className={cn(
              'flex w-full items-center gap-3 border-t border-zinc-100 px-4 py-3 text-left',
              'hover:bg-zinc-50',
            )}
          >
            <span
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                'bg-zinc-200 text-sm font-medium text-zinc-700',
              )}
            >
              {contact.displayName.slice(0, 1)}
            </span>
            <span className={cn('min-w-0')}>
              <span className={cn('block truncate text-sm font-medium text-zinc-900')}>
                {contact.displayName}
              </span>
              <span className={cn('block truncate text-xs text-zinc-500')}>{contact.slug}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

export function ContactsScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const contactsQuery = useQuery({
    queryKey: queryKeys.contacts,
    queryFn: fetchContacts,
    enabled: Boolean(user),
  });

  const contacts = contactsQuery.data ?? [];

  return (
    <div className={cn('flex h-full flex-col bg-zinc-50 text-zinc-900')}>
      <ScreenHeader
        title="通讯录"
        right={
          <HeaderIconButton
            aria-label="添加 AI"
            onClick={() => router.push('/chat/add', { transitionTypes: ['nav-forward'] })}
          >
            <UserPlus className={cn('h-5 w-5')} aria-hidden />
          </HeaderIconButton>
        }
      />

      <PageStatus
        loading={contactsQuery.isLoading}
        error={contactsQuery.isError}
        errorMessage="无法加载通讯录"
      >
        <div className={cn('flex-1 overflow-y-auto')}>
          <section className={cn('bg-white')}>
            <h2 className={cn('px-4 py-2 text-xs font-medium text-zinc-500')}>我的 AI</h2>
            {contacts.length === 0 ? <ContactsEmpty /> : <ContactsList contacts={contacts} />}
          </section>
        </div>
      </PageStatus>
    </div>
  );
}
