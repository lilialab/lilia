'use client';

import type { CSSProperties } from 'react';
import { Toaster } from 'sonner';

/** 覆盖 sonner 默认鲜艳配色，接到主题 token */
const toasterTheme = {
  '--normal-bg': 'var(--background)',
  '--normal-border': 'var(--border)',
  '--normal-text': 'var(--foreground)',
  '--success-bg': 'var(--background)',
  '--success-border': 'var(--border)',
  '--success-text': 'var(--foreground)',
  '--info-bg': 'var(--background)',
  '--info-border': 'var(--border)',
  '--info-text': 'var(--foreground)',
  '--warning-bg': 'var(--background)',
  '--warning-border': 'var(--border)',
  '--warning-text': 'var(--foreground)',
  '--error-bg': 'var(--background)',
  '--error-border': 'color-mix(in srgb, var(--destructive) 45%, var(--border))',
  '--error-text': 'var(--destructive)',
} as CSSProperties;

export function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      richColors
      closeButton
      duration={4000}
      style={toasterTheme}
      toastOptions={{
        classNames: {
          toast: '!rounded-lg !shadow-md',
        },
      }}
    />
  );
}
