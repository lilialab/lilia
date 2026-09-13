'use client';

import { characterAvatarUrl } from '@/client-api/characters';
import { type ContactSummary, fetchContacts } from '@/client-api/contacts';
import { Avatar } from '@/components/Avatar';
import { useTranslations } from '@/components/I18nProvider';
import { PageStatus } from '@/components/PageStatus';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/client/cn';
import { queryKeys } from '@/lib/client/query-keys';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

/* -------------------------------------------------------------------------- */
/* Subcomponents                                                              */
/* -------------------------------------------------------------------------- */

function ContactsEmpty() {
  const t = useTranslations('contacts');
  return <p className={cn('px-4 py-6 text-sm text-muted-foreground')}>{t('empty')}</p>;
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
              'flex w-full items-center gap-3 border-t border-border/50 px-4 py-3 text-left',
              'hover:bg-row-hover',
            )}
          >
            <Avatar
              src={characterAvatarUrl(contact.id, contact.avatarUpdatedAt)}
              hasAvatar={contact.hasAvatar}
              name={contact.name}
            />
            <span className={cn('min-w-0')}>
              <span className={cn('block truncate text-sm font-medium text-foreground')}>
                {contact.name}
              </span>
              <span className={cn('block truncate text-xs text-muted-foreground')}>
                {contact.shortBio}
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

export function ContactsScreen() {
  /* -------------------------------------------------------------------------- */
  /* State & data                                                               */
  /* -------------------------------------------------------------------------- */

  const { user } = useAuth();
  const t = useTranslations('contacts');

  const contactsQuery = useQuery({
    queryKey: queryKeys.contacts,
    queryFn: fetchContacts,
    enabled: Boolean(user),
  });

  const contacts = contactsQuery.data ?? [];

  /* -------------------------------------------------------------------------- */
  /* Render                                                                     */
  /* -------------------------------------------------------------------------- */

  return (
    <div className={cn('flex h-full flex-col bg-surface text-foreground')}>
      <ScreenHeader title={t('title')} />

      <PageStatus
        loading={contactsQuery.isLoading}
        error={contactsQuery.isError}
        errorMessage={t('loadError')}
      >
        <div className={cn('flex-1 overflow-y-auto')}>
          <section className={cn('bg-background')}>
            <h2 className={cn('px-4 py-2 text-xs font-medium text-muted-foreground')}>
              {t('sectionMyAi')}
            </h2>
            {contacts.length === 0 ? <ContactsEmpty /> : <ContactsList contacts={contacts} />}
          </section>
        </div>
      </PageStatus>
    </div>
  );
}
