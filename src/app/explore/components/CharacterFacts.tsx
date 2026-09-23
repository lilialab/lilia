'use client';

import type { CatalogCharacterDetail } from '@/client-api/characters';
import { Badge } from '@/components/Badge';
import { useTranslations } from '@/components/I18nProvider';
import { cn } from '@/lib/client/cn';

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type CharacterFactsData = Pick<
  CatalogCharacterDetail,
  'gender' | 'age' | 'height' | 'occupation' | 'personality' | 'values' | 'attitude'
>;

interface FactItem {
  label: string;
  value: string;
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/** gender 只有 female / male；空串或未知值视为未填。 */
function genderKey(gender: string): 'genderFemale' | 'genderMale' | undefined {
  if (gender === 'female') return 'genderFemale';
  if (gender === 'male') return 'genderMale';
  return undefined;
}

/* -------------------------------------------------------------------------- */
/* Render                                                                     */
/* -------------------------------------------------------------------------- */

interface FactRowProps {
  label: string;
  value: string;
}

/** 标签 + 值一行：同字号，靠 muted / foreground 分主次。 */
function FactRow({ label, value }: FactRowProps) {
  return (
    <div className={cn('flex items-baseline gap-2')}>
      <span className={cn('shrink-0 text-sm text-muted-foreground')}>{label}</span>
      <span className={cn('text-sm text-foreground')}>{value}</span>
    </div>
  );
}

interface FactChipsProps {
  label: string;
  items: string[];
}

/**
 * 标签 + 一排 Badge。字号比标签小，盒子对齐会差 ~3px，靠 baseline 对齐让两者文字坐同一条线。
 * Badge 默认 text-[10px] 是给「官方」这类状态标记调的，这里挨着 14px 标签，提到 text-xs 档。
 */
function FactChips({ label, items }: FactChipsProps) {
  return (
    <div className={cn('flex items-baseline gap-2')}>
      <span className={cn('shrink-0 text-sm text-muted-foreground')}>{label}</span>
      <div className={cn('flex flex-wrap gap-1')}>
        {items.map((item, index) => (
          <Badge key={index} className={cn('text-xs')}>
            {item}
          </Badge>
        ))}
      </div>
    </div>
  );
}

interface CharacterFactsProps {
  character: CharacterFactsData;
}

/** 角色详情基础信息：身份资料 + 性格 / 价值观 + 态度。整块无内容时不渲染。 */
export function CharacterFacts({ character }: CharacterFactsProps) {
  const t = useTranslations('explore');
  const { gender, age, height, occupation, personality, values, attitude } = character;

  const identity: FactItem[] = [];
  const genderLabel = genderKey(gender);
  if (genderLabel) identity.push({ label: t('factsGender'), value: t(genderLabel) });
  if (age?.trim()) {
    identity.push({ label: t('factsAge'), value: t('factsAgeValue', { value: age.trim() }) });
  }
  if (height?.trim()) {
    identity.push({ label: t('factsHeight'), value: height.trim() });
  }
  if (occupation?.trim()) {
    identity.push({ label: t('factsOccupation'), value: occupation.trim() });
  }

  const personalityItems = personality ?? [];
  const valuesItems = values ?? [];
  const attitudeText = attitude?.trim();

  const hasFacts = identity.length > 0
    || personalityItems.length > 0
    || valuesItems.length > 0
    || Boolean(attitudeText);
  if (!hasFacts) return null;

  return (
    <div className={cn('mt-3 flex flex-col gap-4 border-t border-border pt-3')}>
      {identity.length > 0 && (
        <div className={cn('grid grid-cols-2 gap-x-4 gap-y-2')}>
          {identity.map((item) => (
            <FactRow key={item.label} label={item.label} value={item.value} />
          ))}
        </div>
      )}
      {(personalityItems.length > 0 || valuesItems.length > 0) && (
        <div className={cn('flex flex-col gap-2')}>
          {personalityItems.length > 0 && (
            <FactChips label={t('factsPersonality')} items={personalityItems} />
          )}
          {valuesItems.length > 0 && <FactChips label={t('factsValues')} items={valuesItems} />}
        </div>
      )}
      {attitudeText && (
        <div className={cn('flex flex-col gap-1')}>
          <span className={cn('text-sm text-muted-foreground')}>{t('factsAttitude')}</span>
          <p className={cn('text-sm text-foreground')}>{attitudeText}</p>
        </div>
      )}
    </div>
  );
}
