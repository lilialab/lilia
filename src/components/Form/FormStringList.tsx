'use client';

import { formControlClass } from '@/components/Form/form-control';
import { fieldHintClass, fieldLabelClass } from '@/components/Form/form-label';
import { cn } from '@/lib/client/cn';
import { Plus, X } from 'lucide-react';

interface FormStringListProps {
  label: string;
  hint?: string;
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
  hint,
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
      <legend className={fieldLabelClass}>{label}</legend>
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
            className={cn(
              // hover 走 border 而非 row-hover：底色是 bg-chat(#f4f4f5)，row-hover(#fafafa) 更浅，
              // 悬停会像在淡出；--border 在明暗两种模式下都是「深/浅一档」，方向正确
              'flex shrink-0 items-center justify-center gap-1 rounded-md bg-chat px-3',
              'text-sm font-medium text-foreground hover:bg-border',
              'disabled:cursor-not-allowed disabled:opacity-60',
            )}
          >
            <Plus className={cn('h-4 w-4')} aria-hidden />
            {addLabel}
          </button>
        </div>
      )}
      {hint && <span className={fieldHintClass}>{hint}</span>}
    </fieldset>
  );
}
