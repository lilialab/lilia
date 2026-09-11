'use client';

import type { ContactSummary } from '@/client-api/contacts';
import { useTranslations } from '@/components/I18nProvider';
import { cn } from '@/lib/client/cn';

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
  return (
    <section className={cn('bg-background')}>
      {contacts.map((contact) => {
        const checked = selectedIds.has(contact.id);
        return (
          <label
            key={contact.id}
            className={cn(
              'flex cursor-pointer items-center gap-3 border-b border-border/50 px-4 py-3',
              'hover:bg-row-hover',
            )}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onToggle(contact)}
              className={cn('h-4 w-4 rounded border-border')}
            />
            <span className={cn('min-w-0 flex-1')}>
              <span className={cn('block truncate text-sm text-foreground')}>
                {contact.name}
              </span>
              <span className={cn('block truncate text-xs text-muted-foreground')}>
                {contact.shortBio}
              </span>
            </span>
          </label>
        );
      })}
    </section>
  );
}
