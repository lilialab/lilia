'use client';

import { fetchGroups, type GroupDetail } from '@/client-api/groups';
import { PageStatus } from '@/components/PageStatus';
import { HeaderIconButton, ScreenHeader } from '@/components/ScreenHeader';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/client/cn';
import { queryKeys } from '@/lib/client/query-keys';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

function memberSubtitle(group: GroupDetail): string {
  if (group.members.length === 0) return '暂无成员';
  if (group.members.length <= 3) {
    return group.members.map((m) => m.displayName).join('、');
  }
  return `${group.members.length} 位成员`;
}

interface GroupsEmptyProps {
  onCreate: () => void;
}

function GroupsEmpty({ onCreate }: GroupsEmptyProps) {
  return (
    <div className={cn('flex flex-1 flex-col items-center justify-center gap-4 px-6')}>
      <p className={cn('text-sm text-zinc-400')}>还没有群聊</p>
      <button
        type="button"
        onClick={onCreate}
        className={cn(
          'rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white',
          'hover:bg-blue-700',
        )}
      >
        新建群聊
      </button>
    </div>
  );
}

interface GroupsListProps {
  groups: GroupDetail[];
}

function GroupsList({ groups }: GroupsListProps) {
  const router = useRouter();

  return (
    <div className={cn('flex-1 overflow-y-auto')}>
      <section className={cn('bg-white')}>
        {groups.map((group) => (
          <button
            key={group.id}
            type="button"
            onClick={() => router.push(`/groups/${group.id}`, { transitionTypes: ['nav-forward'] })}
            className={cn(
              'flex w-full items-center gap-3 border-b border-zinc-100 px-4 py-3 text-left',
              'hover:bg-zinc-50',
            )}
          >
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-200',
                'text-sm font-medium text-zinc-600',
              )}
              aria-hidden
            >
              {group.title.slice(0, 1)}
            </div>
            <div className={cn('min-w-0 flex-1')}>
              <div className={cn('truncate text-sm font-medium text-zinc-900')}>{group.title}</div>
              <div className={cn('truncate text-xs text-zinc-400')}>{memberSubtitle(group)}</div>
            </div>
          </button>
        ))}
      </section>
    </div>
  );
}

export function GroupsScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const groupsQuery = useQuery({
    queryKey: queryKeys.groups,
    queryFn: fetchGroups,
    enabled: Boolean(user),
  });

  const groups = groupsQuery.data ?? [];

  const openCreate = () => {
    router.push('/groups/new', { transitionTypes: ['nav-forward'] });
  };

  return (
    <div className={cn('flex h-full flex-col bg-zinc-50 text-zinc-900')}>
      <ScreenHeader
        title="群聊"
        right={
          <HeaderIconButton aria-label="新建群聊" onClick={openCreate}>
            <Plus className={cn('h-5 w-5')} aria-hidden />
          </HeaderIconButton>
        }
      />

      <PageStatus
        loading={groupsQuery.isLoading}
        error={groupsQuery.isError}
        errorMessage="无法加载群聊"
      >
        {groups.length === 0
          ? <GroupsEmpty onCreate={openCreate} />
          : <GroupsList groups={groups} />}
      </PageStatus>
    </div>
  );
}
