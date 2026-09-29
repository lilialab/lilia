'use client';

import { cn } from '@/lib/client/cn';
import Script from 'next/script';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';

const TURNSTILE_SCRIPT_SRC =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      action?: string;
      callback?: (token: string) => void;
      'expired-callback'?: () => void;
      'error-callback'?: () => void;
      theme?: 'light' | 'dark' | 'auto';
    },
  ) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export interface TurnstileWidgetHandle {
  reset: () => void;
}

interface TurnstileWidgetProps {
  siteKey: string;
  /** 站点侧标识本次挑战用途 */
  action: string;
  onTokenChange: (token: string | null) => void;
}

/** Cloudflare Turnstile widget；模式（Managed / Non-Interactive）由后台 widget 配置决定。 */
export const TurnstileWidget = forwardRef<TurnstileWidgetHandle, TurnstileWidgetProps>(
  function TurnstileWidget({ siteKey, action, onTokenChange }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | undefined>(undefined);
    const onTokenChangeRef = useRef(onTokenChange);

    onTokenChangeRef.current = onTokenChange;

    const mountWidget = useCallback(() => {
      if (!containerRef.current || !window.turnstile || widgetIdRef.current) {
        return;
      }

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        action,
        theme: 'auto',
        callback: (token) => onTokenChangeRef.current(token),
        'expired-callback': () => onTokenChangeRef.current(null),
        'error-callback': () => onTokenChangeRef.current(null),
      });
    }, [siteKey, action]);

    useEffect(() => {
      mountWidget();

      // `onReady` 只在脚本这次加载完成时触发一次；客户端路由再进来时脚本已在、不会再触发，
      // 所以这里短轮询兜底，直到 api.js 就绪。
      let timer: ReturnType<typeof setInterval> | undefined;
      if (!widgetIdRef.current && !window.turnstile) {
        timer = setInterval(() => {
          mountWidget();
          if (widgetIdRef.current && timer !== undefined) {
            clearInterval(timer);
          }
        }, 200);
      }

      return () => {
        if (timer !== undefined) {
          clearInterval(timer);
        }
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = undefined;
        }
      };
    }, [mountWidget]);

    useImperativeHandle(ref, () => ({
      reset: () => {
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.reset(widgetIdRef.current);
        }
        onTokenChangeRef.current(null);
      },
    }));

    return (
      <>
        <Script src={TURNSTILE_SCRIPT_SRC} strategy="afterInteractive" onReady={mountWidget} />
        <div ref={containerRef} className={cn('flex justify-center')} />
      </>
    );
  },
);
