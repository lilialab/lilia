'use client';

import { formatCommentPostedAt } from '@/app/explore/utils/comment-time';
import { userAvatarUrl } from '@/client-api/auth';
import {
  type CharacterComment,
  COMMENT_BODY_MAX_LENGTH,
  createCharacterComment,
  fetchCharacterComments,
} from '@/client-api/characters';
import { Avatar } from '@/components/Avatar';
import { useTranslations } from '@/components/I18nProvider';
import { useAuth } from '@/hooks/useAuth';
import { translateApiError } from '@/i18n/client';
import { cn } from '@/lib/client/cn';
import { queryKeys } from '@/lib/client/query-keys';
import { showErrorToast } from '@/lib/client/toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

interface ExploreCommentsProps {
  characterId: string;
}

interface ExploreCommentComposerProps {
  characterId: string;
}

interface CommentListProps {
  comments: CharacterComment[];
}

interface CommentComposerProps {
  value: string;
  pending: boolean;
  onChange: (value: string) => void;
  onSubmit: (e: React.SubmitEvent) => void;
}

/* -------------------------------------------------------------------------- */
/* Subcomponents                                                              */
/* -------------------------------------------------------------------------- */

function CommentList({ comments }: CommentListProps) {
  const tCommon = useTranslations('common');

  return (
    <ul>
      {comments.map((comment) => (
        <li key={comment.id} className={cn('flex items-start gap-2 px-4 py-3')}>
          <Avatar
            src={userAvatarUrl(comment.userId, comment.avatarUpdatedAt)}
            hasAvatar={comment.hasAvatar}
            name={comment.nickname}
            size="xs"
          />
          <div className={cn('min-w-0 flex-1')}>
            <p className={cn('text-xs text-muted-foreground')}>{comment.nickname}</p>
            <p className={cn('mt-1 text-sm text-foreground')}>{comment.body}</p>
            <time
              dateTime={comment.createdAt}
              className={cn('mt-1 block text-xs text-muted-foreground')}
            >
              {formatCommentPostedAt(new Date(comment.createdAt), {
                today: tCommon('today'),
                yesterday: tCommon('yesterday'),
              })}
            </time>
          </div>
        </li>
      ))}
    </ul>
  );
}

function CommentComposer({ value, pending, onChange, onSubmit }: CommentComposerProps) {
  const t = useTranslations('explore');

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing) return;
    e.preventDefault();
    if (!value.trim() || pending) return;
    e.currentTarget.form?.requestSubmit();
  }

  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        'border-t border-border bg-background p-3',
        'pb-[max(0.75rem,env(safe-area-inset-bottom))]',
      )}
    >
      <div className={cn('flex items-end gap-2')}>
        <textarea
          rows={1}
          value={value}
          maxLength={COMMENT_BODY_MAX_LENGTH}
          disabled={pending}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          enterKeyHint="send"
          placeholder={t('commentPlaceholder')}
          className={cn(
            'min-h-11 max-h-36 flex-1 resize-none overflow-y-auto px-3 py-2',
            'border border-border rounded-md text-base leading-normal text-foreground',
            'outline-none focus:border-muted-foreground disabled:opacity-40',
          )}
        />
        <button
          type="submit"
          disabled={pending || !value.trim()}
          className={cn(
            'min-h-11 shrink-0 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-hover',
            'disabled:bg-muted-foreground rounded-md text-sm font-medium transition-colors',
          )}
        >
          {t('commentSubmit')}
        </button>
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                 */
/* -------------------------------------------------------------------------- */

export function ExploreComments({ characterId }: ExploreCommentsProps) {
  const { user } = useAuth();
  const t = useTranslations('explore');
  const tCommon = useTranslations('common');

  const commentsQuery = useQuery({
    queryKey: queryKeys.characterComments(characterId),
    queryFn: () => fetchCharacterComments(characterId),
    enabled: Boolean(user),
  });

  const comments = commentsQuery.data;

  return (
    <section className={cn('mt-3 bg-background')}>
      <header className={cn('border-b border-border/50 px-4 py-4')}>
        {comments !== undefined && (
          <h2 className={cn('text-sm font-medium text-foreground')}>
            {t('commentsTitle', { count: comments.length })}
          </h2>
        )}
      </header>
      {commentsQuery.isLoading && comments === undefined && (
        <p className={cn('px-4 py-6 text-sm text-muted-foreground')}>{tCommon('loading')}</p>
      )}
      {commentsQuery.isError && comments === undefined && (
        <p className={cn('px-4 py-6 text-sm text-muted-foreground')}>{t('commentsLoadError')}</p>
      )}
      {comments && comments.length === 0 && (
        <p className={cn('px-4 py-6 text-sm text-muted-foreground')}>{t('noComments')}</p>
      )}
      {comments && comments.length > 0 && <CommentList comments={comments} />}
    </section>
  );
}

export function ExploreCommentComposer({ characterId }: ExploreCommentComposerProps) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState('');

  const postMutation = useMutation({
    mutationFn: (body: string) => createCharacterComment(characterId, body),
    onSuccess: async (comment) => {
      setDraft('');
      const queryKey = queryKeys.characterComments(characterId);
      await queryClient.cancelQueries({ queryKey });
      queryClient.setQueryData<CharacterComment[]>(
        queryKey,
        (prev) => [comment, ...(prev ?? [])],
      );
    },
    onError: (err) => {
      showErrorToast(translateApiError(err), 'character-comment-create');
    },
  });

  function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body || postMutation.isPending) return;
    postMutation.mutate(body);
  }

  return (
    <CommentComposer
      value={draft}
      pending={postMutation.isPending}
      onChange={setDraft}
      onSubmit={handleSubmit}
    />
  );
}
