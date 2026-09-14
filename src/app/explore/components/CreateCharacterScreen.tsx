'use client';

import { createCharacter } from '@/client-api/characters';
import { Form } from '@/components/Form';
import { useTranslations } from '@/components/I18nProvider';
import { ScreenHeader } from '@/components/ScreenHeader';
import { translateApiError } from '@/i18n/client';
import { cn } from '@/lib/client/cn';
import { queryKeys } from '@/lib/client/query-keys';
import {
  CHARACTER_GENDERS,
  CHARACTER_HEIGHT_MAX,
  PERSONALITY_MAX_ITEMS,
} from '@/schemas/shared/character';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { type SubmitEvent, useState } from 'react';

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
  const [gender, setGender] = useState('');
  const [height, setHeight] = useState('');
  const [relation, setRelation] = useState('');
  const [personality, setPersonality] = useState<string[]>([]);
  const [personalityDraft, setPersonalityDraft] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

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
    && gender.length > 0
    && !createMutation.isPending;
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

  const goBack = () => {
    router.push('/explore', { transitionTypes: ['nav-back'] });
  };

  const addPersonality = () => {
    const item = personalityDraft.trim();
    if (!item || personality.length >= PERSONALITY_MAX_ITEMS) return;
    setPersonality([...personality, item]);
    setPersonalityDraft('');
    clearError();
  };

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) return;
    const traits = [...personality];
    const extra = personalityDraft.trim();
    if (extra && traits.length < PERSONALITY_MAX_ITEMS) traits.push(extra);
    setFormError(null);
    createMutation.mutate({
      slug: slug.trim(),
      name: name.trim(),
      shortBio: shortBio.trim() || undefined,
      gender,
      height: height.trim() || undefined,
      relation: relation.trim() || undefined,
      personality: traits.length > 0 ? traits : undefined,
    });
  };

  /* -------------------------------------------------------------------------- */
  /* Render                                                                     */
  /* -------------------------------------------------------------------------- */

  return (
    <div className={cn('flex h-dvh flex-col bg-surface text-foreground')}>
      <ScreenHeader title={t('title')} onBack={goBack} />

      <Form onSubmit={handleSubmit} className={cn('flex min-h-0 flex-1 flex-col')}>
        <div className={cn('min-h-0 flex-1 overflow-y-auto bg-background px-4 py-3')}>
          <Form.Field label={t('slugLabel')} required>
            <Form.Input
              value={slug}
              placeholder={t('slugPlaceholder')}
              onChange={(value) => {
                setSlug(value);
                clearError();
              }}
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              autoFocus
            />
          </Form.Field>
          <Form.Field label={t('nameLabel')} required>
            <Form.Input
              value={name}
              placeholder={t('namePlaceholder')}
              onChange={(value) => {
                setName(value);
                clearError();
              }}
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
            {createMutation.isPending ? t('submitting') : t('submit')}
          </Form.Submit>
        </div>
      </Form>
    </div>
  );
}
