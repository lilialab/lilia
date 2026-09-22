'use client';

import { fieldSurfaceClass } from '@/components/Form/form-control';
import { useTranslations } from '@/components/I18nProvider';
import { cn } from '@/lib/client/cn';
import { showMessageToast } from '@/lib/client/toast';
import { ChevronDown } from 'lucide-react';
import { useLayoutEffect, useRef } from 'react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.SubmitEvent) => void;
  /** 生成中拦截提交并 toast；输入框仍可聚焦、可打字 */
  sendLocked: boolean;
  /** 左侧 @ 选人按钮展示名；与 onMentionClick 成对传入 */
  mentionDisplayName?: string;
  onMentionClick?: () => void;
  /** 变化时聚焦 textarea 并将光标移到末尾 */
  focusKey?: number;
}

/** 约 6 行：min-h-11(2.75rem) + 行高与 padding 估算上限 */
const TEXTAREA_MAX_HEIGHT_PX = 144;

export function ChatInput({
  value,
  onChange,
  onSubmit,
  sendLocked,
  mentionDisplayName,
  onMentionClick,
  focusKey,
}: ChatInputProps) {
  const t = useTranslations('chatInput');
  const tErrors = useTranslations('errors');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const showMention = Boolean(onMentionClick) && Boolean(mentionDisplayName);

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

  function toastIfSendLocked(): boolean {
    if (!sendLocked) return false;
    if (value.trim()) {
      showMessageToast(tErrors('GENERATION_BUSY'), 'chat-send-locked');
    }
    return true;
  }

  function handleSubmit(e: React.SubmitEvent) {
    if (toastIfSendLocked()) {
      e.preventDefault();
      return;
    }
    onSubmit(e);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing) return;
    e.preventDefault();
    if (toastIfSendLocked() || !value.trim()) return;
    e.currentTarget.form?.requestSubmit();
  }

  function keepTextareaFocus(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'border-t border-border bg-background p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]',
      )}
    >
      <div className={cn('flex items-end gap-2')}>
        {showMention && (
          <button
            type="button"
            aria-label={t('mentionAria', { name: mentionDisplayName ?? '' })}
            onClick={onMentionClick}
            className={cn(
              'flex min-h-11 max-w-28 shrink-0 items-center gap-1 rounded-md border border-border bg-chat px-2',
              'text-sm font-medium text-foreground/80 transition-colors',
              'hover:bg-border',
            )}
          >
            <span className={cn('min-w-0 truncate')}>@{mentionDisplayName}</span>
            <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 text-muted-foreground')} aria-hidden />
          </button>
        )}
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          enterKeyHint="send"
          placeholder={t('placeholder')}
          className={cn(
            'min-h-11 max-h-36 flex-1 resize-none overflow-y-auto leading-normal',
            fieldSurfaceClass,
          )}
        />
        <button
          type="submit"
          disabled={!value.trim()}
          onMouseDown={keepTextareaFocus}
          className={cn(
            'min-h-11 shrink-0 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary-hover',
            'disabled:bg-muted-foreground rounded-md text-base font-medium transition-colors',
          )}
        >
          {t('send')}
        </button>
      </div>
    </form>
  );
}
