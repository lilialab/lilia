'use client';

import { useTranslations } from '@/components/I18nProvider';
import { cn } from '@/lib/client/cn';
import { isAtBottom } from '@/utils/scroll';
import { ChevronDown } from 'lucide-react';
import { type RefObject, useCallback, useEffect, useState } from 'react';

interface ScrollToBottomButtonProps {
  scrollRef: RefObject<HTMLDivElement | null>;
  onScrollToBottom: () => void;
}

export function ScrollToBottomButton({ scrollRef, onScrollToBottom }: ScrollToBottomButtonProps) {
  const t = useTranslations('scrollToBottom');
  const [showButton, setShowButton] = useState(false);

  const updateButtonVisibility = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setShowButton(!isAtBottom(el));
  }, [scrollRef]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    updateButtonVisibility();
    el.addEventListener('scroll', updateButtonVisibility, { passive: true });

    const resizeObserver = new ResizeObserver(() => {
      updateButtonVisibility();
    });
    resizeObserver.observe(el);

    return () => {
      el.removeEventListener('scroll', updateButtonVisibility);
      resizeObserver.disconnect();
    };
  }, [scrollRef, updateButtonVisibility]);

  const handleClick = () => {
    onScrollToBottom();
    setShowButton(false);
  };

  if (!showButton) return null;

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'absolute bottom-3 right-3 z-10 flex min-h-11 min-w-11 items-center justify-center rounded-full bg-background border border-border shadow-md text-foreground/80 hover:bg-surface active:bg-surface',
      )}
      aria-label={t('ariaLabel')}
    >
      <ChevronDown className={cn('h-5 w-5')} aria-hidden />
    </button>
  );
}
