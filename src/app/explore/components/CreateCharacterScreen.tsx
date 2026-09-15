'use client';

import { createCharacter } from '@/client-api/characters';
import { Form } from '@/components/Form';
import { useTranslations } from '@/components/I18nProvider';
import { ScreenHeader } from '@/components/ScreenHeader';
import { translateApiError } from '@/i18n/client';
import { cn } from '@/lib/client/cn';
import { queryKeys } from '@/lib/client/query-keys';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { type SubmitEvent, useEffect, useState } from 'react';
import { CharacterBasicsFields } from './CharacterBasicsFields';
import { CharacterProfileFields, useCharacterProfileFields } from './CharacterProfileFields';

export function CreateCharacterScreen() {
  /* -------------------------------------------------------------------------- */
  /* State & data                                                               */
  /* -------------------------------------------------------------------------- */

  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations('createCharacter');
  const [slug, setSlug] = useState('');
  const [name, setName] = useState('');
  const [shortBio, setShortBio] = useState('');
  const profile = useCharacterProfileFields();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  const createMutation = useMutation({
    mutationFn: createCharacter,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.characters });
      router.replace('/explore', { transitionTypes: ['nav-back'] });
    },
    onError: (err) => {
      setFormError(translateApiError(err));
    },
  });

  const canSubmit = slug.trim().length > 0
    && name.trim().length > 0
    && shortBio.trim().length > 0
    && profile.gender.length > 0
    && !createMutation.isPending;

  /* -------------------------------------------------------------------------- */
  /* Handlers                                                                   */
  /* -------------------------------------------------------------------------- */

  const clearError = () => setFormError(null);

  const goBack = () => {
    router.push('/explore', { transitionTypes: ['nav-back'] });
  };

  const handleAvatarFile = (file: File) => {
    clearError();
    setAvatarPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setAvatarFile(file);
  };

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) return;
    setFormError(null);
    createMutation.mutate({
      slug: slug.trim(),
      name: name.trim(),
      shortBio: shortBio.trim(),
      ...profile.toPayload(),
      avatar: avatarFile ?? undefined,
    });
  };

  /* -------------------------------------------------------------------------- */
  /* Render                                                                     */
  /* -------------------------------------------------------------------------- */

  return (
    <div className={cn('flex h-dvh flex-col bg-surface text-foreground')}>
      <ScreenHeader title={t('title')} onBack={goBack} />

      <Form onSubmit={handleSubmit} className={cn('flex min-h-0 flex-1 flex-col')}>
        <div className={cn('min-h-0 flex-1 overflow-y-auto py-3')}>
          <CharacterBasicsFields
            avatarSrc={avatarPreview ?? ''}
            hasAvatar={Boolean(avatarPreview)}
            name={name}
            onNameChange={setName}
            shortBio={shortBio}
            onShortBioChange={setShortBio}
            slug={slug}
            onSlugChange={setSlug}
            gender={profile.gender}
            onGenderChange={profile.setGender}
            onAvatarFile={handleAvatarFile}
            onAvatarTooLarge={() => {
              setFormError(translateApiError({ code: 'AVATAR_TOO_LARGE' }));
            }}
            onClearError={clearError}
            nameAutoFocus
          />
          <CharacterProfileFields fields={profile} onClearError={clearError} />
          {formError && (
            <p className={cn('mt-3 px-4 text-sm text-destructive')} role="alert">
              {formError}
            </p>
          )}
        </div>

        <div
          className={cn(
            'shrink-0 border-t border-border bg-background p-3',
            'pb-[max(0.75rem,env(safe-area-inset-bottom))]',
          )}
        >
          <Form.Submit disabled={!canSubmit}>
            {createMutation.isPending ? t('publishing') : t('publish')}
          </Form.Submit>
        </div>
      </Form>
    </div>
  );
}
