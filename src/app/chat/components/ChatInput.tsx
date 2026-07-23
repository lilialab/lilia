'use client';

import { cn } from '@/lib/client/cn';
import { useLayoutEffect, useRef } from 'react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.SubmitEvent) => void;
  disabled: boolean;
  isStreaming: boolean;
  /** 有值时在输入框左侧显示 @ 按钮（如群聊成员选择） */
  onAtClick?: () => void;
  /** 变化时聚焦 textarea 并将光标移到末尾 */
  focusKey?: number;
}

/** 约 6 行：min-h-11(2.75rem) + 行高与 padding 估算上限 */
const TEXTAREA_MAX_HEIGHT_PX = 144;

export function ChatInput({
  value,
  onChange,
  onSubmit,
  disabled,
  isStreaming,
  onAtClick,
  focusKey,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, TEXTAREA_MAX_HEIGHT_PX)}px`;
  }, [value]);

  useLayoutEffect(() => {
    if (focusKey === undefined) return;
    const el = textareaRef.current;
    if (!el) return;
    el.focus();
    const len = el.value.length;
    el.setSelectionRange(len, len);
  }, [focusKey]);

  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        'border-t border-zinc-200 bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]',
      )}
    >
      <div className={cn('flex items-end gap-2')}>
        {onAtClick && (
          <button
            type="button"
            aria-label="选择要 @ 的成员"
            disabled={disabled}
            onClick={onAtClick}
            className={cn(
              'min-h-11 min-w-11 shrink-0 rounded-md border border-zinc-300 bg-white',
              'text-base font-medium text-zinc-700 transition-colors',
              'hover:bg-zinc-50 disabled:bg-zinc-100 disabled:text-zinc-400',
            )}
          >
            @
          </button>
        )}
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={isStreaming ? '正在生成中...' : '输入消息...'}
          disabled={disabled}
          className={cn(
            'min-h-11 max-h-36 flex-1 resize-none overflow-y-auto px-3 py-2',
            'border border-zinc-300 rounded-md text-base leading-normal',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-zinc-100',
          )}
        />
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className={cn(
            'min-h-11 shrink-0 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-400',
            'text-white rounded-md text-base font-medium transition-colors',
          )}
        >
          发送
        </button>
      </div>
    </form>
  );
}
