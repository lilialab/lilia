'use client';

import {
  type CatalogCharacterDetail,
  characterAvatarUrl,
  fetchCharacter,
  updateCharacter,
  uploadCharacterAvatar,
} from '@/client-api/characters';
import { AvatarPicker } from '@/components/Avatar';
import { Form } from '@/components/Form';
import { useTranslations } from '@/components/I18nProvider';
import { PageStatus } from '@/components/PageStatus';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useAuth } from '@/hooks/useAuth';
import { translateApiError } from '@/i18n/client';
import { cn } from '@/lib/client/cn';
import { queryKeys } from '@/lib/client/query-keys';
import {
  CHARACTER_GENDERS,
  CHARACTER_HEIGHT_MAX,
  PERSONALITY_MAX_ITEMS,
} from '@/schemas/shared/character';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { type SubmitEvent, useEffect, useState } from 'react';

interface EditCharacterScreenProps {
  characterId: string;
}

interface EditCharacterFormProps {
  character: CatalogCharacterDetail;
  onBack: () => void;
}

function heightDigits(value: string | undefined): string {
  return value?.replace(/\D/g, '') ?? '';
}

function formGender(value: string): string {
  return CHARACTER_GENDERS.some((gender) => gender === value) ? value : '';
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
  const [gender, setGender] = useState(formGender(character.gender));
  const [height, setHeight] = useState(heightDigits(character.height));
  const [relation, setRelation] = useState(character.relation ?? '');
  const [personality, setPersonality] = useState(character.personality ?? []);
  const [personalityDraft, setPersonalityDraft] = useState('');
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
      shortBio: string | undefined;
      gender: string;
      height: string | undefined;
      relation: string | undefined;
      personality: string[] | undefined;
      avatar: File | undefined;
    }) => {
      const { avatar, ...body } = input;
      await updateCharacter(character.id, body);
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
  const canSubmit = name.trim().length > 0 && gender.length > 0 && !saveMutation.isPending;
  const genderMessageKey = {
    female: 'genderFemale',
    male: 'genderMale',
  } as const;
  const genderOptions = CHARACTER_GENDERS.map((value) => ({
    value,
    label: t(genderMessageKey[value]),
  }));

  /* -------------------------------------------------------------------------- */
  /* Handlers                                                                   */
  /* -------------------------------------------------------------------------- */

  const clearError = () => setFormError(null);

  const addPersonality = () => {
    const item = personalityDraft.trim();
    if (!item || personality.length >= PERSONALITY_MAX_ITEMS) return;
    setPersonality([...personality, item]);
    setPersonalityDraft('');
    clearError();
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
    const traits = [...personality];
    const extra = personalityDraft.trim();
    if (extra && traits.length < PERSONALITY_MAX_ITEMS) traits.push(extra);
    setFormError(null);
    saveMutation.mutate({
      name: name.trim(),
      shortBio: shortBio.trim() || undefined,
      gender,
      height: height.trim() || undefined,
      relation: relation.trim() || undefined,
      personality: traits.length > 0 ? traits : undefined,
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
        <div className={cn('min-h-0 flex-1 overflow-y-auto bg-background px-4 py-3')}>
          <div className={cn('flex flex-col items-center')}>
            <AvatarPicker
              src={pickerSrc}
              hasAvatar={pickerHasAvatar}
              name={name}
              ariaLabel={pickerHasAvatar ? t('avatarHintChange') : t('avatarHintAdd')}
              onFile={handleAvatarFile}
              onFileTooLarge={() => {
                setFormError(translateApiError({ code: 'AVATAR_TOO_LARGE' }));
              }}
            />
            <p className={cn('mt-2 text-xs text-muted-foreground')}>
              {pickerHasAvatar ? t('avatarHintChange') : t('avatarHintAdd')}
            </p>
          </div>
          <Form.Field label={t('slugLabel')}>
            <Form.Input value={character.slug} readOnly />
          </Form.Field>
          <Form.Field label={t('nameLabel')} required>
            <Form.Input
              value={name}
              placeholder={t('namePlaceholder')}
              onChange={(value) => {
                setName(value);
                clearError();
              }}
              autoFocus
            />
          </Form.Field>
          <Form.Field label={t('shortBioLabel')}>
            <Form.Input
              value={shortBio}
              placeholder={t('shortBioPlaceholder')}
              onChange={(value) => {
                setShortBio(value);
                clearError();
              }}
            />
          </Form.Field>
          <Form.Field label={t('genderLabel')} required>
            <Form.Select
              value={gender}
              onChange={(value) => {
                setGender(value);
                clearError();
              }}
              emptyLabel={t('genderPlaceholder')}
              options={genderOptions}
            />
          </Form.Field>
          <Form.Field label={t('heightLabel')}>
            <Form.Number
              value={height}
              placeholder={t('heightPlaceholder')}
              max={CHARACTER_HEIGHT_MAX}
              onChange={(value) => {
                setHeight(value);
                clearError();
              }}
            />
          </Form.Field>
          <Form.Field label={t('relationLabel')}>
            <Form.Input
              value={relation}
              placeholder={t('relationPlaceholder')}
              onChange={(value) => {
                setRelation(value);
                clearError();
              }}
            />
          </Form.Field>
          <Form.StringList
            label={t('personalityLabel')}
            items={personality}
            draft={personalityDraft}
            placeholder={t('personalityPlaceholder')}
            addLabel={t('personalityAdd')}
            removeLabel={t('personalityRemove')}
            maxItems={PERSONALITY_MAX_ITEMS}
            onDraftChange={(value) => {
              setPersonalityDraft(value);
              clearError();
            }}
            onAdd={addPersonality}
            onRemove={(index) => {
              setPersonality(personality.toSpliced(index, 1));
              clearError();
            }}
          />
          {formError && (
            <p className={cn('mt-3 text-sm text-destructive')} role="alert">
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
