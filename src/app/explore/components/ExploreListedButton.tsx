'use client';

import { setCharacterListed } from '@/client-api/characters';
import { useTranslations } from '@/components/I18nProvider';
import { translateApiError } from '@/i18n/client';
import { cn } from '@/lib/client/cn';
import { queryKeys } from '@/lib/client/query-keys';
import { showErrorToast, showSuccessToast } from '@/lib/client/toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface ExploreListedButtonProps {
  characterId: string;
  isListed: boolean;
}

export function ExploreListedButton({ characterId, isListed }: ExploreListedButtonProps) {
  const queryClient = useQueryClient();
  const t = useTranslations('explore');

  const listedMutation = useMutation({
    mutationFn: (next: boolean) => setCharacterListed(characterId, next),
    onSuccess: async (character) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.character(characterId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.characters }),
      ]);
      showSuccessToast(
        character.isListed ? t('listedToast') : t('unlistedToast'),
        'character-listed',
      );
    },
    onError: (err) => {
      showErrorToast(translateApiError(err), 'character-listed');
    },
  });

  return (
    <button
      type="button"
      disabled={listedMutation.isPending}
      onClick={() => listedMutation.mutate(!isListed)}
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-md border border-border',
        'px-2.5 py-1.5 text-xs text-foreground/80 hover:bg-row-hover disabled:opacity-40',
      )}
    >
      {isListed ? t('unlist') : t('relist')}
    </button>
  );
}
