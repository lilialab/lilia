'use client';

import type { ContactSummary } from '@/client-api/contacts';
import { cn } from '@/lib/client/cn';

/** 与 DEFAULT_CHARACTER_ID / seed slug 对齐；勿从 prompts/load 导入（含 fs）。 */
export const DEFAULT_CHARACTER_SLUG = 'arbor';

export function MemberPickerEmpty() {
  return (
    <p className={cn('px-4 py-4 text-sm text-zinc-400')}>
      通讯录加载异常，请返回后重试
    </p>
  );
}

export type MemberPickerListProps = {
  contacts: ContactSummary[];
  selectedIds: Set<string>;
  onToggle: (contact: ContactSummary) => void;
};

export function MemberPickerList({ contacts, selectedIds, onToggle }: MemberPickerListProps) {
  return (
    <section className={cn('bg-white')}>
      {contacts.map((contact) => {
        const isArbor = contact.slug === DEFAULT_CHARACTER_SLUG;
        const checked = selectedIds.has(contact.id);
        return (
          <label
            key={contact.id}
            className={cn(
              'flex items-center gap-3 border-b border-zinc-100 px-4 py-3',
              isArbor ? 'cursor-default' : 'cursor-pointer hover:bg-zinc-50',
            )}
          >
            <input
              type="checkbox"
              checked={checked}
              disabled={isArbor}
              onChange={() => onToggle(contact)}
              className={cn('h-4 w-4 rounded border-zinc-300')}
            />
            <span className={cn('text-sm text-zinc-900')}>
              {contact.displayName}
              {isArbor && (
                <span className={cn('ml-2 text-xs font-normal text-zinc-400')}>默认成员</span>
              )}
            </span>
          </label>
        );
      })}
    </section>
  );
}
