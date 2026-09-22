'use client';

import { Form } from '@/components/Form';
import { useTranslations } from '@/components/I18nProvider';
import {
  CHARACTER_AGE_MAX,
  CHARACTER_GENDERS,
  CHARACTER_HEIGHT_MAX,
  PERSONALITY_ITEM_MAX_LENGTH,
  PERSONALITY_MAX_ITEMS,
  PROFILE_LINE_MAX_LENGTH,
  PROFILE_LIST_MAX_ITEMS,
  PROFILE_TEXT_MAX_LENGTH,
} from '@/schemas/shared/character';
import { useState } from 'react';

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

interface StringListState {
  items: string[];
  draft: string;
  setDraft: (value: string) => void;
  add: () => void;
  remove: (index: number) => void;
  flush: () => string[] | undefined;
  maxItems: number;
}

function useStringList(initial: string[] | undefined, maxItems: number): StringListState {
  const [items, setItems] = useState(initial ?? []);
  const [draft, setDraft] = useState('');

  const add = () => {
    const item = draft.trim();
    if (!item || items.length >= maxItems) return;
    setItems([...items, item]);
    setDraft('');
  };

  const flush = (): string[] | undefined => {
    const next = [...items];
    const extra = draft.trim();
    if (extra && next.length < maxItems) next.push(extra);
    return next.length > 0 ? next : undefined;
  };

  return {
    items,
    draft,
    setDraft,
    add,
    remove: (index) => setItems(items.toSpliced(index, 1)),
    flush,
    maxItems,
  };
}

function formGender(value: string): string {
  return CHARACTER_GENDERS.some((gender) => gender === value) ? value : '';
}

function digitsOnly(value: string | undefined): string {
  return value?.replace(/\D/g, '') ?? '';
}

/* -------------------------------------------------------------------------- */
/* Hook                                                                       */
/* -------------------------------------------------------------------------- */

export interface CharacterProfileFieldsInitial {
  gender: string;
  age: string | undefined;
  height: string | undefined;
  occupation: string | undefined;
  relation: string | undefined;
  attitude: string | undefined;
  personality: string[] | undefined;
  values: string[] | undefined;
  dislikes: string[] | undefined;
}

/** 人设：身份、态度、性格、价值观、不喜欢。 */
export function useCharacterProfileFields(initial?: CharacterProfileFieldsInitial) {
  const [gender, setGender] = useState(initial ? formGender(initial.gender) : '');
  const [age, setAge] = useState(digitsOnly(initial?.age));
  const [height, setHeight] = useState(digitsOnly(initial?.height));
  const [occupation, setOccupation] = useState(initial?.occupation ?? '');
  const [relation, setRelation] = useState(initial?.relation ?? '');
  const [attitude, setAttitude] = useState(initial?.attitude ?? '');
  const personality = useStringList(initial?.personality, PERSONALITY_MAX_ITEMS);
  const values = useStringList(initial?.values, PROFILE_LIST_MAX_ITEMS);
  const dislikes = useStringList(initial?.dislikes, PROFILE_LIST_MAX_ITEMS);

  const toPayload = () => ({
    gender,
    age: age.trim() || undefined,
    height: height.trim() || undefined,
    occupation: occupation.trim() || undefined,
    relation: relation.trim() || undefined,
    attitude: attitude.trim() || undefined,
    personality: personality.flush(),
    values: values.flush(),
    dislikes: dislikes.flush(),
  });

  return {
    gender,
    setGender,
    age,
    setAge,
    height,
    setHeight,
    occupation,
    setOccupation,
    relation,
    setRelation,
    attitude,
    setAttitude,
    personality,
    values,
    dislikes,
    toPayload,
  };
}

/* -------------------------------------------------------------------------- */
/* Render                                                                     */
/* -------------------------------------------------------------------------- */

interface CharacterProfileFieldsProps {
  fields: ReturnType<typeof useCharacterProfileFields>;
  onClearError: () => void;
}

function stringListBind(list: StringListState, onClearError: () => void) {
  return {
    items: list.items,
    draft: list.draft,
    maxItems: list.maxItems,
    onDraftChange: (value: string) => {
      list.setDraft(value);
      onClearError();
    },
    onAdd: () => {
      list.add();
      onClearError();
    },
    onRemove: (index: number) => {
      list.remove(index);
      onClearError();
    },
  };
}

export function CharacterProfileFields({ fields, onClearError }: CharacterProfileFieldsProps) {
  const t = useTranslations('createCharacter');

  return (
    <>
      <Form.Section title={t('sectionIdentity')}>
        <Form.Row>
          <Form.Field label={t('ageLabel')}>
            <Form.Number
              value={fields.age}
              placeholder={t('agePlaceholder')}
              max={CHARACTER_AGE_MAX}
              onChange={(value) => {
                fields.setAge(value);
                onClearError();
              }}
            />
          </Form.Field>
          <Form.Field label={t('heightLabel')}>
            <Form.Number
              value={fields.height}
              placeholder={t('heightPlaceholder')}
              max={CHARACTER_HEIGHT_MAX}
              onChange={(value) => {
                fields.setHeight(value);
                onClearError();
              }}
            />
          </Form.Field>
        </Form.Row>
        <Form.Field label={t('occupationLabel')}>
          <Form.Input
            value={fields.occupation}
            placeholder={t('occupationPlaceholder')}
            onChange={(value) => {
              fields.setOccupation(value);
              onClearError();
            }}
          />
        </Form.Field>
        <Form.Field label={t('relationLabel')}>
          <Form.Input
            value={fields.relation}
            placeholder={t('relationPlaceholder')}
            onChange={(value) => {
              fields.setRelation(value);
              onClearError();
            }}
          />
        </Form.Field>
      </Form.Section>
      <Form.Section title={t('sectionPersona')}>
        <Form.Field
          label={t('attitudeLabel')}
          hint={t('attitudeHint', { max: PROFILE_TEXT_MAX_LENGTH })}
        >
          <Form.Textarea
            value={fields.attitude}
            placeholder={t('attitudePlaceholder')}
            onChange={(value) => {
              fields.setAttitude(value);
              onClearError();
            }}
          />
        </Form.Field>
        <Form.StringList
          label={t('personalityLabel')}
          hint={t('listHint', {
            itemMax: PERSONALITY_ITEM_MAX_LENGTH,
            max: PERSONALITY_MAX_ITEMS,
          })}
          placeholder={t('personalityPlaceholder')}
          addLabel={t('personalityAdd')}
          removeLabel={t('personalityRemove')}
          {...stringListBind(fields.personality, onClearError)}
        />
        <Form.StringList
          label={t('valuesLabel')}
          hint={t('listHint', { itemMax: PROFILE_LINE_MAX_LENGTH, max: PROFILE_LIST_MAX_ITEMS })}
          placeholder={t('valuesPlaceholder')}
          addLabel={t('personalityAdd')}
          removeLabel={t('personalityRemove')}
          {...stringListBind(fields.values, onClearError)}
        />
        <Form.StringList
          label={t('dislikesLabel')}
          hint={t('listHint', { itemMax: PROFILE_LINE_MAX_LENGTH, max: PROFILE_LIST_MAX_ITEMS })}
          placeholder={t('dislikesPlaceholder')}
          addLabel={t('personalityAdd')}
          removeLabel={t('personalityRemove')}
          {...stringListBind(fields.dislikes, onClearError)}
        />
      </Form.Section>
    </>
  );
}
