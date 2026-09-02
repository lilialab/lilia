import { cn } from '@/lib/client/cn';
import type { ReactNode } from 'react';

const CONTACT_EMAIL = 'liuyuchuan816@gmail.com';

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

const listClass = cn('list-disc space-y-1.5 pl-5');

/** 按当前产品行为写的英文隐私说明；不宣称合规。 */
export function PrivacyPolicyBody() {
  return (
    <article lang="en" className={cn('mx-auto max-w-2xl px-4 py-6 pb-12')}>
      <p className={cn('text-sm text-muted-foreground')}>Last updated: 2 September 2026</p>
      <p className={cn('mt-4 text-sm leading-relaxed text-foreground/90')}>
        This page describes what Lilia actually does with your information. It is not a claim that
        we comply with the GDPR, CCPA, or any other privacy law.
      </p>

      <PrivacySection title="Who we are">
        <p>
          Lilia is a chat app with long-term memory. It is operated by an individual, not a company.
        </p>
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
        <p>We also process, for a limited time:</p>
        <ul className={listClass}>
          <li>
            Your IP address, to limit abusive sign-up and login attempts (short-lived rate-limit
            counters in Redis)
          </li>
          <li>
            Job records in Redis that identify which chat should be processed for memory extraction
            (user id and session id, not the full message text)
          </li>
          <li>
            Operational logs such as errors. We do not currently log full chat transcripts on
            purpose. An error log may still include a username, a request path, or a short snippet
            of a failed request
          </li>
        </ul>
        <p>
          On sign-up we use Cloudflare Turnstile to tell humans from bots. Cloudflare receives the
          verification token and whatever data their widget collects. See Cloudflare’s own privacy
          policy for that part.
        </p>
        <p>We do not use advertising SDKs or third-party analytics products.</p>
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

      <PrivacySection title="Where it is stored and who else sees it">
        <p>
          <span className={cn('font-medium text-foreground')}>Our servers.</span>{' '}
          The app database (MySQL), the vector store (Chroma), Redis, and application logs run on a
          Vultr virtual machine in the western United States. If we move the server, we will update
          this page.
        </p>
        <p>
          <span className={cn('font-medium text-foreground')}>
            Default language model and embeddings.
          </span>{' '}
          Chat replies (unless you set your own API), memory extraction, memory maintenance, profile
          generation, and embeddings are sent to SiliconFlow (硅基流动), a company based in China.
          We currently use a DeepSeek model they host. SiliconFlow receives the text we send them.
          We do not control how long they keep it, whom they share it with, or where they process
          it.
        </p>
        <p>
          <span className={cn('font-medium text-foreground')}>Your own LLM API.</span>{' '}
          If you save your own OpenAI-compatible base URL, API key, and model, chat completions go
          to that endpoint instead of our default. Memory extraction, embeddings, and related
          background jobs still use SiliconFlow.
        </p>
        <p>We do not sell your information. We do not show ads.</p>
        <p>
          Because this is a memory product, the sensitive part is not only that we store your chats,
          but that we derive lasting notes and a profile from them, and that copies of that text go
          to SiliconFlow.
        </p>
      </PrivacySection>

      <PrivacySection title="How long we keep it">
        <p>
          We keep your account, chats, memories, embeddings, and profiles until you delete your
          account.
        </p>
        <p>
          Login cookies last for a limited number of days set on the server (on the order of weeks).
        </p>
        <p>
          Rate-limit keys in Redis expire on a short schedule (minutes to about a day, depending on
          the limit). Memory job records in Redis are removed after they complete or fail, aside
          from a small recent history.
        </p>
      </PrivacySection>

      <PrivacySection title="What you can do">
        <ul className={listClass}>
          <li>
            Change nickname, password, language, and LLM API settings while signed in
          </li>
          <li>
            Delete your account in Settings. That permanently deletes your user row in our database
            (chats, memories, profiles, and login sessions go with it) and deletes your vectors in
            Chroma
          </li>
          <li>
            Email us if something did not delete and we can still reach it on our servers
          </li>
        </ul>
        <p>
          We cannot delete copies that SiliconFlow (or your own LLM provider) may already have
          processed.
        </p>
        <p>
          There is no in-app export of all your data yet. If you need a copy, email us and we will
          do what we reasonably can.
        </p>
      </PrivacySection>

      <PrivacySection title="Cookies">
        <p>
          We set one first-party cookie: an HTTP-only session cookie used to keep you logged in. It
          is marked Secure in production and SameSite=Lax.
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
          If you use Lilia from outside the United States, your information is transferred to the
          United States (our Vultr server) and to China (SiliconFlow). We do not offer a regional
          storage option.
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
