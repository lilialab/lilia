'use client';

import { deleteCharacter } from '@/client-api/characters';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useTranslations } from '@/components/I18nProvider';
import { translateApiError } from '@/i18n/client';
import { cn } from '@/lib/client/cn';
import { queryKeys } from '@/lib/client/query-keys';
import { showErrorToast, showSuccessToast } from '@/lib/client/toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface ExploreDeleteButtonProps {
  characterId: string;
  characterName: string;
}

export function ExploreDeleteButton({ characterId, characterName }: ExploreDeleteButtonProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations('explore');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => deleteCharacter(characterId),
    onSuccess: async () => {
      setConfirmOpen(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.characters }),
        queryClient.removeQueries({ queryKey: queryKeys.character(characterId) }),
        queryClient.removeQueries({ queryKey: queryKeys.characterComments(characterId) }),
      ]);
      showSuccessToast(t('deletedToast'), 'character-deleted');
      router.push('/explore', { transitionTypes: ['nav-back'] });
    },
    onError: (err) => {
      showErrorToast(translateApiError(err), 'character-deleted');
    },
  });

  return (
    <>
      <button
        type="button"
        disabled={deleteMutation.isPending}
        onClick={() => setConfirmOpen(true)}
        className={cn(
          'inline-flex shrink-0 items-center justify-center rounded-md px-4 py-2',
          'text-sm font-medium text-destructive-foreground bg-destructive hover:bg-destructive-hover active:bg-destructive-hover',
          'disabled:cursor-not-allowed disabled:opacity-40',
        )}
      >
        {t('delete')}
      </button>
      <ConfirmDialog
        open={confirmOpen}
        title={t('delete')}
        description={t('deleteDescription', { name: characterName })}
        confirmLabel={t('deleteConfirm')}
        variant="danger"
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
