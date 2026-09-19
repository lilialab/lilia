'use client';

import {
  type CatalogCharacterDetail,
  characterAvatarUrl,
  fetchCharacter,
  updateCharacter,
  uploadCharacterAvatar,
} from '@/client-api/characters';
import { Form } from '@/components/Form';
import { useTranslations } from '@/components/I18nProvider';
import { PageStatus } from '@/components/PageStatus';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useAuth } from '@/hooks/useAuth';
import { translateApiError } from '@/i18n/client';
import { cn } from '@/lib/client/cn';
import { queryKeys } from '@/lib/client/query-keys';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { type SubmitEvent, useEffect, useState } from 'react';
import { CharacterBasicsFields } from './CharacterBasicsFields';
import { CharacterProfileFields, useCharacterProfileFields } from './CharacterProfileFields';

interface EditCharacterScreenProps {
  characterId: string;
}

interface EditCharacterFormProps {
  character: CatalogCharacterDetail;
  onBack: () => void;
}

export function EditCharacterScreen({ characterId }: EditCharacterScreenProps) {
  /* -------------------------------------------------------------------------- */
  /* State & data                                                               */
  /* -------------------------------------------------------------------------- */

  const router = useRouter();
  const { user } = useAuth();
  const t = useTranslations('createCharacter');
  const tExplore = useTranslations('explore');
  const tErrors = useTranslations('errors');

  const characterQuery = useQuery({
    queryKey: queryKeys.character(characterId),
    queryFn: () => fetchCharacter(characterId),
    enabled: Boolean(user),
  });

  const character = characterQuery.data;
  const goDetail = () => {
    router.push(`/explore/${characterId}`, { transitionTypes: ['nav-back'] });
  };
  const goList = () => {
    router.push('/explore', { transitionTypes: ['nav-back'] });
  };
  const forbidden = character !== undefined && !character.isOwner;

  /* -------------------------------------------------------------------------- */
  /* Render                                                                     */
  /* -------------------------------------------------------------------------- */

  if (character?.isOwner) {
    return <EditCharacterForm character={character} onBack={goDetail} />;
  }

  return (
    <div className={cn('flex h-dvh flex-col bg-surface text-foreground')}>
      <ScreenHeader title={t('editTitle')} onBack={goDetail} />
      <PageStatus
        loading={characterQuery.isLoading}
        error={characterQuery.isError || forbidden}
        errorMessage={characterQuery.isError
          ? tExplore('notFound')
          : tErrors('CHARACTER_NOT_OWNER')}
        actionLabel={characterQuery.isError ? tExplore('backToList') : tExplore('backToDetail')}
        onAction={characterQuery.isError ? goList : goDetail}
      />
    </div>
  );
}

function EditCharacterForm({ character, onBack }: EditCharacterFormProps) {
  /* -------------------------------------------------------------------------- */
  /* State & data                                                               */
  /* -------------------------------------------------------------------------- */

  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations('createCharacter');
  const [name, setName] = useState(character.name);
  const [shortBio, setShortBio] = useState(character.shortBio);
  const profile = useCharacterProfileFields({
    gender: character.gender,
    age: character.age,
    height: character.height,
    occupation: character.occupation,
    relation: character.relation,
    attitude: character.attitude,
    personality: character.personality,
    values: character.values,
    dislikes: character.dislikes,
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  const saveMutation = useMutation({
    mutationFn: async (input: {
      name: string;
      shortBio: string;
      gender: string;
      age: string | undefined;
      height: string | undefined;
      occupation: string | undefined;
      relation: string | undefined;
      attitude: string | undefined;
      personality: string[] | undefined;
      values: string[] | undefined;
      dislikes: string[] | undefined;
      avatar: File | undefined;
    }) => {
      const { avatar, ...body } = input;
      // 官方角色人设由 characters.json + seed 管，服务端也会拒改；这里跳过内容、只提交头像。
      if (!character.isOfficial) await updateCharacter(character.id, body);
      if (avatar) await uploadCharacterAvatar(character.id, avatar);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.character(character.id) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.characters }),
        queryClient.invalidateQueries({ queryKey: queryKeys.contacts }),
      ]);
      router.replace(`/explore/${character.id}`, { transitionTypes: ['nav-back'] });
    },
    onError: (err) => {
      setFormError(translateApiError(err));
    },
  });

  const existingAvatarSrc = character.hasAvatar
    ? characterAvatarUrl(character.id, character.avatarUpdatedAt)
    : '';
  const pickerSrc = avatarPreview ?? existingAvatarSrc;
  const pickerHasAvatar = Boolean(avatarPreview) || character.hasAvatar;
  const canSubmit = name.trim().length > 0
    && shortBio.trim().length > 0
    && profile.gender.length > 0
    && !saveMutation.isPending;

  /* -------------------------------------------------------------------------- */
  /* Handlers                                                                   */
  /* -------------------------------------------------------------------------- */

  const clearError = () => setFormError(null);

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
    saveMutation.mutate({
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
      <ScreenHeader title={t('editTitle')} onBack={onBack} />

      <Form onSubmit={handleSubmit} className={cn('flex min-h-0 flex-1 flex-col')}>
        <div className={cn('min-h-0 flex-1 overflow-y-auto py-3')}>
          <CharacterBasicsFields
            avatarSrc={pickerSrc}
            hasAvatar={pickerHasAvatar}
            name={name}
            onNameChange={setName}
            shortBio={shortBio}
            onShortBioChange={setShortBio}
            slug={character.slug}
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
            {saveMutation.isPending ? t('saving') : t('save')}
          </Form.Submit>
        </div>
      </Form>
    </div>
  );
}
