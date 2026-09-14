'use client';

import { formControlClass } from '@/components/Form/form-control';
import { cn } from '@/lib/client/cn';
import { X } from 'lucide-react';

interface FormStringListProps {
  label: string;
  items: string[];
  draft: string;
  placeholder: string;
  addLabel: string;
  removeLabel: string;
  maxItems: number;
  onDraftChange: (value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}

/** 可增删的字符串列表。 */
export function FormStringList({
  label,
  items,
  draft,
  placeholder,
  addLabel,
  removeLabel,
  maxItems,
  onDraftChange,
  onAdd,
  onRemove,
}: FormStringListProps) {
  const canAdd = draft.trim().length > 0 && items.length < maxItems;

  return (
    <fieldset className={cn('mt-4')}>
      <legend className={cn('text-xs font-medium text-muted-foreground')}>{label}</legend>
      {items.length > 0 && (
        <ul className={cn('mt-1.5 space-y-1.5')}>
          {items.map((item, index) => (
            <li
              key={`${item}-${index}`}
              className={cn(
                'flex items-center gap-2 rounded-md border border-border px-3 py-2 text-base',
              )}
            >
              <span className={cn('min-w-0 flex-1 truncate text-foreground')}>{item}</span>
              <button
                type="button"
                onClick={() => onRemove(index)}
                aria-label={removeLabel}
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground',
                  'hover:bg-row-hover hover:text-foreground',
                )}
              >
                <X className={cn('h-4 w-4')} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className={cn('mt-1.5 flex gap-2')}>
        <input
          type="text"
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return;
            e.preventDefault();
            if (canAdd) onAdd();
          }}
          placeholder={placeholder}
          className={cn(formControlClass, 'mt-0')}
        />
        <button
          type="button"
          onClick={onAdd}
          disabled={!canAdd}
          className={cn(
            'shrink-0 rounded-md border border-border px-3 text-sm font-medium text-foreground',
            'hover:bg-row-hover disabled:cursor-not-allowed disabled:opacity-40',
          )}
        >
          {addLabel}
        </button>
      </div>
    </fieldset>
  );
}
