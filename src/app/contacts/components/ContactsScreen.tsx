'use client';

import { characterAvatarUrl } from '@/client-api/characters';
import { type ContactSummary, fetchContacts } from '@/client-api/contacts';
import { Avatar } from '@/components/Avatar';
import { useTranslations } from '@/components/I18nProvider';
import { PageStatus } from '@/components/PageStatus';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useRequiredUser } from '@/hooks/useRequiredUser';
import { cn } from '@/lib/client/cn';
import { queryKeys } from '@/lib/client/query-keys';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

/* -------------------------------------------------------------------------- */
/* Subcomponents                                                              */
/* -------------------------------------------------------------------------- */

interface SaveAccountBannerProps {
  onPress: () => void;
}

/** 匿名账号引导条：未设密码时展示，点进「保存账号」。 */
function SaveAccountBanner({ onPress }: SaveAccountBannerProps) {
  const t = useTranslations('account');

  return (
    <section className={cn('bg-background px-4 py-3')}>
      <p className={cn('text-sm text-foreground')}>{t('anonymousBannerTitle')}</p>
      <p className={cn('mt-1 text-xs text-muted-foreground')}>{t('anonymousBannerHint')}</p>
      <button
        type="button"
        onClick={onPress}
        className={cn(
          'mt-3 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground',
          'hover:bg-primary-hover active:bg-primary-hover',
        )}
      >
        {t('saveAccount')}
      </button>
    </section>
  );
}

function ContactsEmpty() {
  const router = useRouter();
  const t = useTranslations('contacts');

  return (
    <div className={cn('flex flex-1 flex-col items-center justify-center gap-4 px-6')}>
      <p className={cn('text-sm text-muted-foreground')}>{t('empty')}</p>
      <button
        type="button"
        onClick={() => router.push('/explore', { transitionTypes: ['tab'] })}
        className={cn(
          'rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground',
          'hover:bg-primary-hover active:bg-primary-hover',
        )}
      >
        {t('goExplore')}
      </button>
    </div>
  );
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
              'hover:bg-row-hover active:bg-row-hover',
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

  const user = useRequiredUser();
  const router = useRouter();
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

      {!user.hasPassword && (
        <SaveAccountBanner
          onPress={() => router.push('/me/settings/account', { transitionTypes: ['nav-forward'] })}
        />
      )}

      <PageStatus
        loading={contactsQuery.isLoading}
        error={contactsQuery.isError}
        errorMessage={t('loadError')}
      >
        {contacts.length === 0 ? <ContactsEmpty /> : (
          <div className={cn('flex-1 overflow-y-auto')}>
            <section className={cn('bg-background')}>
              <h2 className={cn('px-4 py-2 text-xs font-medium text-muted-foreground')}>
                {t('sectionMyAi')}
              </h2>
              <ContactsList contacts={contacts} />
            </section>
          </div>
        )}
      </PageStatus>
    </div>
  );
}
