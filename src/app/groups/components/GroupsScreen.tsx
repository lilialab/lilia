'use client';

import { fetchGroups, type GroupDetail } from '@/client-api/groups';
import { type TranslationFn, useTranslations } from '@/components/I18nProvider';
import { PageStatus } from '@/components/PageStatus';
import { HeaderIconButton, ScreenHeader } from '@/components/ScreenHeader';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/client/cn';
import { queryKeys } from '@/lib/client/query-keys';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function memberSubtitle(group: GroupDetail, t: TranslationFn<'groups'>): string {
  if (group.members.length === 0) return t('noMembers');
  if (group.members.length <= 3) {
    return group.members.map((m) => m.name).join(t('memberNameSeparator'));
  }
  return t('memberCount', { count: group.members.length });
}

/* -------------------------------------------------------------------------- */
/* Subcomponents                                                              */
/* -------------------------------------------------------------------------- */

interface GroupsEmptyProps {
  onCreate: () => void;
}

function GroupsEmpty({ onCreate }: GroupsEmptyProps) {
  const t = useTranslations('groups');

  return (
    <div className={cn('flex flex-1 flex-col items-center justify-center gap-4 px-6')}>
      <p className={cn('text-sm text-muted-foreground')}>{t('empty')}</p>
      <button
        type="button"
        onClick={onCreate}
        className={cn(
          'rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground',
          'hover:bg-primary-hover',
        )}
      >
        {t('create')}
      </button>
    </div>
  );
}

interface GroupsListProps {
  groups: GroupDetail[];
}

function GroupsList({ groups }: GroupsListProps) {
  const router = useRouter();
  const t = useTranslations('groups');

  return (
    <div className={cn('flex-1 overflow-y-auto')}>
      <section className={cn('bg-background')}>
        {groups.map((group) => (
          <button
            key={group.id}
            type="button"
            onClick={() => router.push(`/groups/${group.id}`, { transitionTypes: ['nav-forward'] })}
            className={cn(
              'flex w-full items-center gap-3 border-b border-border/50 px-4 py-3 text-left',
              'hover:bg-row-hover',
            )}
          >
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-border',
                'text-sm font-medium text-foreground/70',
              )}
              aria-hidden
            >
              {group.title.slice(0, 1)}
            </div>
            <div className={cn('min-w-0 flex-1')}>
              <div className={cn('truncate text-sm font-medium text-foreground')}>
                {group.title}
              </div>
              <div className={cn('truncate text-xs text-muted-foreground')}>
                {memberSubtitle(group, t)}
              </div>
            </div>
          </button>
        ))}
      </section>
    </div>
  );
}

export function GroupsScreen() {
  /* -------------------------------------------------------------------------- */
  /* State & data                                                               */
  /* -------------------------------------------------------------------------- */

  const router = useRouter();
  const { user } = useAuth();
  const t = useTranslations('groups');

  const groupsQuery = useQuery({
    queryKey: queryKeys.groups,
    queryFn: fetchGroups,
    enabled: Boolean(user),
  });

  const groups = groupsQuery.data ?? [];

  /* -------------------------------------------------------------------------- */
  /* Handlers                                                                   */
  /* -------------------------------------------------------------------------- */

  const openCreate = () => {
    router.push('/groups/new', { transitionTypes: ['nav-forward'] });
  };

  /* -------------------------------------------------------------------------- */
  /* Render                                                                     */
  /* -------------------------------------------------------------------------- */

  return (
    <div className={cn('flex h-full flex-col bg-surface text-foreground')}>
      <ScreenHeader
        title={t('title')}
        right={
          <HeaderIconButton aria-label={t('create')} onClick={openCreate}>
            <Plus className={cn('h-5 w-5')} aria-hidden />
          </HeaderIconButton>
        }
      />

      <PageStatus
        loading={groupsQuery.isLoading}
        error={groupsQuery.isError}
        errorMessage={t('loadError')}
      >
        {groups.length === 0
          ? <GroupsEmpty onCreate={openCreate} />
          : <GroupsList groups={groups} />}
      </PageStatus>
    </div>
  );
}
