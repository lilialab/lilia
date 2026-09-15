'use client';

import { formControlClass } from '@/components/Form/form-control';
import { cn } from '@/lib/client/cn';
import { Plus, X } from 'lucide-react';

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

/** 可增删的字符串列表（已加项为标签）。 */
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
        <ul className={cn('mt-1.5 flex flex-wrap gap-1.5')}>
          {items.map((item, index) => (
            <li
              key={`${item}-${index}`}
              className={cn(
                'flex max-w-full items-center gap-1 rounded-md bg-chat py-1 pl-2.5 pr-1',
              )}
            >
              <span className={cn('min-w-0 truncate text-sm text-foreground')}>{item}</span>
              <button
                type="button"
                onClick={() => onRemove(index)}
                aria-label={removeLabel}
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground',
                  'hover:bg-row-hover hover:text-foreground',
                )}
              >
                <X className={cn('h-3.5 w-3.5')} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
      {items.length < maxItems && (
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
            aria-label={addLabel}
            className={cn(
              'flex w-10 shrink-0 items-center justify-center rounded-md border border-border',
              'text-foreground hover:bg-row-hover disabled:cursor-not-allowed disabled:opacity-40',
            )}
          >
            <Plus className={cn('h-4 w-4')} aria-hidden />
          </button>
        </div>
      )}
    </fieldset>
  );
}
