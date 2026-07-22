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
      <span className={cn('text-sm font-medium text-zinc-700')}>{label}</span>
      <input
        id={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900',
          'outline-none focus:border-zinc-400',
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
    <div className={cn('flex min-h-dvh items-center justify-center bg-zinc-50 px-4')}>
      <div
        className={cn('w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-sm')}
      >
        <h1 className={cn('mb-6 text-center text-xl font-semibold text-zinc-900')}>{title}</h1>
        {children}
        {footer && (
          <div className={cn('mt-6 text-center text-sm text-zinc-500')}>{footer}</div>
        )}
      </div>
    </div>
  );
}
