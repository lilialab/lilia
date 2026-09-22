'use client';

import { AvatarPicker } from '@/components/Avatar';
import { Form } from '@/components/Form';
import { useTranslations } from '@/components/I18nProvider';
import { cn } from '@/lib/client/cn';
import { CHARACTER_GENDERS, CHARACTER_SHORT_BIO_MAX_LENGTH } from '@/schemas/shared/character';

interface CharacterBasicsFieldsProps {
  avatarSrc: string;
  hasAvatar: boolean;
  name: string;
  onNameChange: (value: string) => void;
  shortBio: string;
  onShortBioChange: (value: string) => void;
  slug: string;
  onSlugChange?: (value: string) => void;
  gender: string;
  onGenderChange: (value: string) => void;
  onAvatarFile: (file: File) => void;
  onAvatarTooLarge: () => void;
  onClearError: () => void;
  nameAutoFocus?: boolean;
}

/** 基本信息：头像、姓名、简介、账号名、性别。 */
export function CharacterBasicsFields({
  avatarSrc,
  hasAvatar,
  name,
  onNameChange,
  shortBio,
  onShortBioChange,
  slug,
  onSlugChange,
  gender,
  onGenderChange,
  onAvatarFile,
  onAvatarTooLarge,
  onClearError,
  nameAutoFocus,
}: CharacterBasicsFieldsProps) {
  const t = useTranslations('createCharacter');
  const tCommon = useTranslations('common');
  const genderMessageKey = {
    female: 'genderFemale',
    male: 'genderMale',
  } as const;
  const genderOptions = CHARACTER_GENDERS.map((value) => ({
    value,
    label: t(genderMessageKey[value]),
  }));
  const slugEditable = onSlugChange !== undefined;

  return (
    <Form.Section title={t('sectionBasic')}>
      <div className={cn('mt-4 flex items-center gap-3')}>
        <AvatarPicker
          src={avatarSrc}
          hasAvatar={hasAvatar}
          name={name}
          ariaLabel={hasAvatar ? t('avatarHintChange') : t('avatarHintAdd')}
          onFile={onAvatarFile}
          onFileTooLarge={onAvatarTooLarge}
        />
        <div className={cn('min-w-0 flex-1')}>
          <Form.Field label={t('nameLabel')} required>
            <Form.Input
              value={name}
              placeholder={t('namePlaceholder')}
              onChange={(value) => {
                onNameChange(value);
                onClearError();
              }}
              autoFocus={nameAutoFocus}
            />
          </Form.Field>
        </div>
      </div>
      <Form.Field
        label={t('shortBioLabel')}
        required
        hint={t('shortBioHint', { max: CHARACTER_SHORT_BIO_MAX_LENGTH })}
      >
        <Form.Input
          value={shortBio}
          placeholder={t('shortBioPlaceholder')}
          onChange={(value) => {
            onShortBioChange(value);
            onClearError();
          }}
        />
      </Form.Field>
      <Form.Field
        label={t('slugLabel')}
        required={slugEditable}
        hint={slugEditable ? t('slugHint') : undefined}
      >
        <Form.Input
          value={slug}
          placeholder={tCommon('fieldPlaceholder', { label: t('slugLabel') })}
          readOnly={!slugEditable}
          onChange={onSlugChange
            ? (value) => {
              onSlugChange(value);
              onClearError();
            }
            : undefined}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
        />
      </Form.Field>
      <Form.Field label={t('genderLabel')} required>
        <Form.Segmented
          value={gender}
          options={genderOptions}
          onChange={(value) => {
            onGenderChange(value);
            onClearError();
          }}
        />
      </Form.Field>
    </Form.Section>
  );
}
