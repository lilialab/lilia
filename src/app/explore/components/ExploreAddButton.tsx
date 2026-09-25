'use client';

import { addContact } from '@/client-api/contacts';
import { useTranslations } from '@/components/I18nProvider';
import { translateApiError } from '@/i18n/client';
import { cn } from '@/lib/client/cn';
import { queryKeys } from '@/lib/client/query-keys';
import { showErrorToast, showSuccessToast } from '@/lib/client/toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus } from 'lucide-react';

interface ExploreAddButtonProps {
  characterId: string;
  isContact: boolean;
  variant?: 'compact' | 'primary';
  className?: string;
}

export function ExploreAddButton({
  characterId,
  isContact,
  variant = 'compact',
  className,
}: ExploreAddButtonProps) {
  const queryClient = useQueryClient();
  const t = useTranslations('explore');

  const addMutation = useMutation({
    mutationFn: addContact,
    onSuccess: async (contact) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.contacts, exact: true }),
        queryClient.invalidateQueries({ queryKey: queryKeys.characters }),
      ]);
      showSuccessToast(t('addedToast', { name: contact.name }));
    },
    onError: (err) => {
      showErrorToast(translateApiError(err), 'contact-add');
    },
  });

  return (
    <button
      type="button"
      disabled={isContact || addMutation.isPending}
      onClick={() => addMutation.mutate(characterId)}
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-md',
        'disabled:cursor-not-allowed disabled:opacity-40',
        variant === 'primary'
          ? 'justify-center gap-1.5 bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover active:bg-primary-hover'
          : 'border border-border px-2.5 py-1.5 text-xs text-foreground/80 hover:bg-row-hover active:bg-row-hover',
        className,
      )}
    >
      <UserPlus className={cn('h-3.5 w-3.5')} aria-hidden />
      {isContact ? t('added') : t('add')}
    </button>
  );
}
