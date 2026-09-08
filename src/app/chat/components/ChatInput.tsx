'use client';

import { useTranslations } from '@/components/I18nProvider';
import { cn } from '@/lib/client/cn';
import { useId, useLayoutEffect, useRef } from 'react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.SubmitEvent) => void;
  /** 生成中禁止提交；输入框仍可聚焦、可打字 */
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const waitHintId = useId();
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

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing) return;
    e.preventDefault();
    if (sendLocked || !value.trim()) return;
    e.currentTarget.form?.requestSubmit();
  }

  function keepTextareaFocus(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
  }

  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        'border-t border-border bg-background p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]',
      )}
    >
      {sendLocked && (
        <p id={waitHintId} role="status" className={cn('mb-2 text-xs text-muted-foreground')}>
          {t('waitForReply')}
        </p>
      )}
      <div className={cn('flex items-end gap-2')}>
        {showMention && (
          <button
            type="button"
            aria-label={t('mentionAria', { name: mentionDisplayName ?? '' })}
            onClick={onMentionClick}
            className={cn(
              'min-h-11 max-w-28 shrink-0 truncate rounded-md border border-border bg-background px-2',
              'text-sm font-medium text-foreground/80 transition-colors',
              'hover:bg-surface',
            )}
          >
            @{mentionDisplayName}
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
          aria-describedby={sendLocked ? waitHintId : undefined}
          className={cn(
            'min-h-11 max-h-36 flex-1 resize-none overflow-y-auto px-3 py-2',
            'border border-border rounded-md text-base leading-normal text-foreground',
            'outline-none focus:border-muted-foreground',
          )}
        />
        <button
          type="submit"
          disabled={sendLocked || !value.trim()}
          aria-describedby={sendLocked ? waitHintId : undefined}
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
