import { cn } from '@/lib/client/cn';
import type { ReactNode } from 'react';

const CONTACT_EMAIL = 'liuyuchuan816@gmail.com';
const SILICONFLOW_PRIVACY = 'https://docs.siliconflow.cn/en/legals/privacy-policy';
const CLOUDFLARE_PRIVACY = 'https://www.cloudflare.com/privacypolicy/';

interface PrivacySectionProps {
  title: string;
  children: ReactNode;
}

function PrivacySection({ title, children }: PrivacySectionProps) {
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

function ExternalLink({ href, children }: ExternalLinkProps) {
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

const listClass = cn('list-disc space-y-1.5 pl-5');

/** 按当前产品行为写的英文隐私说明。 */
export function PrivacyPolicyBody() {
  return (
    <article lang="en" className={cn('mx-auto max-w-2xl px-4 py-6 pb-12')}>
      <p className={cn('text-sm text-muted-foreground')}>Last updated: 4 September 2026</p>
      <p className={cn('mt-4 text-sm leading-relaxed text-foreground/90')}>
        We treat your chats as private. We only keep what Lilia needs to run, we do not sell your
        information, and we do not use it for advertising. This page explains what we store, how we
        protect it, who helps us process it, and what happens when you delete your account.
      </p>

      <PrivacySection title="Who we are">
        <p>Lilia is a chat app with long-term memory, run by one person.</p>
        <p>
          Contact:{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className={cn('text-primary underline')}>
            {CONTACT_EMAIL}
          </a>
        </p>
      </PrivacySection>

      <PrivacySection title="What we collect">
        <p>When you create an account and use Lilia, we store:</p>
        <ul className={listClass}>
          <li>
            Account data: username, nickname, a hash of your password (not the password itself),
            language preference, and timezone
          </li>
          <li>
            Optional LLM settings you enter (API base URL, model name, and API key). The key is
            stored encrypted
          </li>
          <li>Your chat messages, including one-to-one and group chats</li>
          <li>
            Memories extracted from those chats (short facts and events), and a profile we generate
            for you with each AI character
          </li>
          <li>Vector embeddings of those memories, used to recall them in later chats</li>
          <li>A login cookie so you stay signed in</li>
        </ul>
        <p>We also process, briefly, what we need to keep the service stable:</p>
        <ul className={listClass}>
          <li>Your IP address, to limit abusive sign-up and login attempts</li>
          <li>
            Background job records that identify which chat should be processed for memory (user id
            and session id, not the full message text)
          </li>
          <li>
            Operational logs such as errors. We do not log full chat transcripts. An error log may
            still include a username, a request path, or a short snippet of a failed request
          </li>
        </ul>
        <p>
          On sign-up we use Cloudflare Turnstile to tell humans from bots. Cloudflare receives what
          its widget needs for that check. See{' '}
          <ExternalLink href={CLOUDFLARE_PRIVACY}>Cloudflare’s privacy policy</ExternalLink>.
        </p>
      </PrivacySection>

      <PrivacySection title="How we use it">
        <ul className={listClass}>
          <li>To run the product: sign you in, store chats, and show your contacts and groups</li>
          <li>
            To give each AI character memory of you: we send recent chat text to a language model to
            extract memories, embed them, periodically maintain them, and build a profile
          </li>
          <li>To keep the service stable: rate limits, error logs, and abuse prevention</li>
        </ul>
      </PrivacySection>

      <PrivacySection title="How we protect it">
        <ul className={listClass}>
          <li>Your password is stored as a hash. We never keep the password itself</li>
          <li>If you add your own LLM API key, we store it encrypted</li>
          <li>The login cookie is HTTP-only, so page scripts cannot read it</li>
          <li>We do not use advertising SDKs or third-party analytics</li>
          <li>We do not sell your information</li>
          <li>We do not use your chats to train a Lilia model</li>
        </ul>
      </PrivacySection>

      <PrivacySection title="Where it is stored and who else sees it">
        <p>
          <span className={cn('font-medium text-foreground')}>Our servers.</span>{' '}
          Your account, chats, memories, and embeddings live on a server we operate in the western
          United States (Vultr). If that location changes, we will update this page.
        </p>
        <p>
          <span className={cn('font-medium text-foreground')}>
            Default language model and embeddings.
          </span>{' '}
          Chat replies (unless you set your own API), memory extraction, memory maintenance, profile
          generation, and embeddings are sent to SiliconFlow (硅基流动), a company based in China.
          We currently use a DeepSeek model they host. SiliconFlow receives the text we send so it
          can run the model. That processing is covered by{' '}
          <ExternalLink href={SILICONFLOW_PRIVACY}>SiliconFlow’s privacy policy</ExternalLink>.
        </p>
        <p>
          <span className={cn('font-medium text-foreground')}>Your own LLM API.</span>{' '}
          If you save your own OpenAI-compatible base URL, API key, and model, chat replies go to
          that endpoint instead of our default. Memory extraction, embeddings, and related
          background jobs still use SiliconFlow, so that text still goes there.
        </p>
      </PrivacySection>

      <PrivacySection title="How long we keep it">
        <p>
          We keep your account, chats, memories, embeddings, and profiles until you delete your
          account.
        </p>
        <p>The login cookie expires after a limited period.</p>
        <p>
          Rate-limit records and background job records are short-lived and are removed when they
          expire or finish.
        </p>
      </PrivacySection>

      <PrivacySection title="What you can do">
        <ul className={listClass}>
          <li>Change nickname, password, language, and LLM API settings while signed in</li>
          <li>
            Delete your account in Settings. That permanently removes your account, chats, memories,
            profiles, login sessions, and stored vectors from our systems
          </li>
          <li>
            Email us if something did not delete and we can still reach it on our servers. We will
            remove it
          </li>
        </ul>
        <p>
          Text already sent to SiliconFlow (or your own LLM provider) is processed under their
          privacy policy. We cannot delete copies on their systems.
        </p>
        <p>
          There is no in-app export of all your data yet. If you need a copy, email us and we will
          do what we reasonably can.
        </p>
      </PrivacySection>

      <PrivacySection title="Cookies">
        <p>
          We set one first-party cookie: an HTTP-only session cookie used to keep you logged in. In
          production it is marked Secure.
        </p>
        <p>Cloudflare Turnstile may set its own cookies during registration.</p>
      </PrivacySection>

      <PrivacySection title="Children">
        <p>
          Lilia is not directed at children under 13. Do not create an account if you are under 13.
        </p>
      </PrivacySection>

      <PrivacySection title="International users">
        <p>
          If you use Lilia from outside the United States, your account data is stored in the United
          States, and text sent for model inference is processed by SiliconFlow in China. We do not
          currently offer a choice of region.
        </p>
      </PrivacySection>

      <PrivacySection title="Changes">
        <p>
          We will change this page when the product changes (for example a different default model
          provider or server region). The date at the top is the last update.
        </p>
      </PrivacySection>
    </article>
  );
}
