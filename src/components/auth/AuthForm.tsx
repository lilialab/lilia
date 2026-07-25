import { cn } from '@/lib/client/cn';
import type { ReactNode } from 'react';

interface AuthFieldProps {
  id: string;
  label: string;
  type?: 'text' | 'password';
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
}

export function AuthField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  autoComplete,
}: AuthFieldProps) {
  return (
    <label htmlFor={id} className={cn('flex flex-col gap-1.5')}>
      <span className={cn('text-sm font-medium text-foreground/80')}>{label}</span>
      <input
        id={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground',
          'outline-none focus:border-muted-foreground',
        )}
      />
    </label>
  );
}

interface AuthShellProps {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthShell({ title, children, footer }: AuthShellProps) {
  return (
    <div className={cn('flex min-h-dvh items-center justify-center bg-surface px-4')}>
      <div
        className={cn(
          'w-full max-w-sm rounded-xl border border-border bg-background p-6 shadow-sm',
        )}
      >
        <h1 className={cn('mb-6 text-center text-xl font-semibold text-foreground')}>{title}</h1>
        {children}
        {footer && (
          <div className={cn('mt-6 text-center text-sm text-muted-foreground')}>{footer}</div>
        )}
      </div>
    </div>
  );
}
