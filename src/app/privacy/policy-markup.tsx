import { cn } from '@/lib/client/cn';
import type { ReactNode } from 'react';

export const CONTACT_EMAIL = 'liuyuchuan816@gmail.com';
export const SILICONFLOW_PRIVACY = 'https://docs.siliconflow.cn/en/legals/privacy-policy';
export const CLOUDFLARE_PRIVACY = 'https://www.cloudflare.com/privacypolicy/';

export const listClass = cn('list-disc space-y-1.5 pl-5');

interface PrivacySectionProps {
  title: string;
  children: ReactNode;
}

export function PrivacySection({ title, children }: PrivacySectionProps) {
  return (
    <section className={cn('mt-8')}>
      <h2 className={cn('text-base font-semibold text-foreground')}>{title}</h2>
      <div className={cn('mt-2 flex flex-col gap-3 text-sm leading-relaxed text-foreground/90')}>
        {children}
      </div>
    </section>
  );
}

interface ExternalLinkProps {
  href: string;
  children: ReactNode;
}

export function ExternalLink({ href, children }: ExternalLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn('text-primary underline')}
    >
      {children}
    </a>
  );
}

interface PolicyArticleProps {
  lang: string;
  updated: string;
  intro: string;
  children: ReactNode;
}

export function PolicyArticle({ lang, updated, intro, children }: PolicyArticleProps) {
  return (
    <article lang={lang} className={cn('mx-auto max-w-2xl px-4 py-6 pb-12')}>
      <p className={cn('text-sm text-muted-foreground')}>{updated}</p>
      <p className={cn('mt-4 text-sm leading-relaxed text-foreground/90')}>{intro}</p>
      {children}
    </article>
  );
}
