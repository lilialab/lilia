'use client';

import type { ContactSummary } from '@/client-api/contacts';
import { useTCharacter, useTranslations } from '@/components/I18nProvider';
import { cn } from '@/lib/client/cn';

/** 与 DEFAULT_CHARACTER_ID / seed slug 对齐；勿从 prompts/load 导入（含 fs）。 */
export const DEFAULT_CHARACTER_SLUG = 'lilia';

export function MemberPickerEmpty() {
  const t = useTranslations('groupMembers');
  return <p className={cn('px-4 py-4 text-sm text-muted-foreground')}>{t('pickerEmpty')}</p>;
}

export type MemberPickerListProps = {
  contacts: ContactSummary[];
  selectedIds: Set<string>;
  onToggle: (contact: ContactSummary) => void;
};

export function MemberPickerList({ contacts, selectedIds, onToggle }: MemberPickerListProps) {
  const tCharacter = useTCharacter();
  const t = useTranslations('groupMembers');

  return (
    <section className={cn('bg-background')}>
      {contacts.map((contact) => {
        const isDefaultCharacter = contact.slug === DEFAULT_CHARACTER_SLUG;
        const checked = selectedIds.has(contact.id);
        return (
          <label
            key={contact.id}
            className={cn(
              'flex items-center gap-3 border-b border-border/50 px-4 py-3',
              isDefaultCharacter ? 'cursor-default' : 'cursor-pointer hover:bg-surface',
            )}
          >
            <input
              type="checkbox"
              checked={checked}
              disabled={isDefaultCharacter}
              onChange={() => onToggle(contact)}
              className={cn('h-4 w-4 rounded border-border')}
            />
            <span className={cn('min-w-0 flex-1')}>
              <span className={cn('block truncate text-sm text-foreground')}>
                {tCharacter(contact.slug)}
                {isDefaultCharacter && (
                  <span className={cn('ml-2 text-xs font-normal text-muted-foreground')}>
                    {t('defaultMember')}
                  </span>
                )}
              </span>
              <span className={cn('block truncate text-xs text-muted-foreground')}>
                {contact.slug}
              </span>
            </span>
          </label>
        );
      })}
    </section>
  );
}
