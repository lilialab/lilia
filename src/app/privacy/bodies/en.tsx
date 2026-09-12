import { cn } from '@/lib/client/cn';
import {
  CLOUDFLARE_PRIVACY,
  CONTACT_EMAIL,
  ExternalLink,
  listClass,
  PolicyArticle,
  PrivacySection,
  SILICONFLOW_PRIVACY_EN,
} from '../policy-markup';

export function PrivacyPolicyEn() {
  return (
    <PolicyArticle
      lang="en"
      updated="Last updated: 12 September 2026"
      intro="This notice is for people using LILIA in China. We treat your chats as private. We only process the personal information the service needs to run, we do not sell it, and we do not use it for advertising. This page explains what we process, why, who else is involved, and how you can access, correct, or delete it."
    >
      <PrivacySection title="Who we are">
        <p>
          LILIA is a chat app with long-term memory, built and run by one person. It is currently
          offered only to users in China.
        </p>
        <p>
          Contact:{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className={cn('text-primary underline')}>
            {CONTACT_EMAIL}
          </a>
        </p>
      </PrivacySection>

      <PrivacySection title="What personal information we process">
        <p>When you create an account and use LILIA, we process:</p>
        <ul className={listClass}>
          <li>
            Account data: username, nickname, optional profile photo, a hash of your password (not
            the password itself), language preference, and timezone
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
          On sign-up we use Cloudflare Turnstile to tell humans from bots. Cloudflare is a US
          company; information needed for that check is sent outside mainland China. See{' '}
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
          <li>We do not sell your personal information</li>
          <li>We do not use your chats to train a LILIA model</li>
        </ul>
      </PrivacySection>

      <PrivacySection title="Where it is stored and who else sees it">
        <p>
          <span className={cn('font-medium text-foreground')}>Our servers.</span>{' '}
          Your account, chats, memories, and embeddings live on servers we operate. The data center
          may change as we redeploy and may be outside mainland China. We will not update this page
          or notify you solely for that.
        </p>
        <p>
          <span className={cn('font-medium text-foreground')}>
            Default language model and embeddings.
          </span>{' '}
          Chat replies (unless you set your own API), memory extraction, memory maintenance, profile
          generation, and embeddings are sent to SiliconFlow (北京硅基流动科技有限公司), a company
          in China. We currently use a DeepSeek model they host. SiliconFlow receives the text we
          send so it can run the model. That processing is covered by{' '}
          <ExternalLink href={SILICONFLOW_PRIVACY_EN}>SiliconFlow’s privacy policy</ExternalLink>.
        </p>
        <p>
          <span className={cn('font-medium text-foreground')}>Your own LLM API.</span>{' '}
          If you save your own OpenAI-compatible base URL, API key, and model, chat replies go to
          that endpoint instead of our default. Memory extraction, embeddings, and related
          background jobs still use SiliconFlow, so that text still goes there.
        </p>
        <p>We do not provide your personal information to other third parties except as above.</p>
      </PrivacySection>

      <PrivacySection title="How long we keep it">
        <p>
          We keep your account, chats, memories, embeddings, profiles, and profile photo until you
          delete your account.
        </p>
        <p>The login cookie expires after a limited period.</p>
        <p>
          Rate-limit records and background job records are short-lived and are removed when they
          expire or finish.
        </p>
      </PrivacySection>

      <PrivacySection title="What you can do">
        <ul className={listClass}>
          <li>
            View and change nickname, profile photo, password, language, and LLM API settings while
            signed in
          </li>
          <li>
            Delete your account in Settings. That permanently removes your account, chats, memories,
            profiles, login sessions, stored vectors, and profile photo from our systems
          </li>
          <li>
            Email us if something did not delete and we can still reach it. We will remove it
          </li>
        </ul>
        <p>
          Text already sent to SiliconFlow (or your own LLM provider) is processed under their
          privacy policy. We cannot delete copies on their systems.
        </p>
        <p>
          There is no in-app export of all your personal information yet. If you need a copy, email
          us and we will do what we reasonably can.
        </p>
      </PrivacySection>

      <PrivacySection title="Cookies">
        <p>
          We set one first-party cookie: an HTTP-only session cookie used to keep you logged in. In
          production it is marked Secure.
        </p>
        <p>
          Cloudflare Turnstile may set its own cookies during registration (those may also be
          outside mainland China).
        </p>
      </PrivacySection>

      <PrivacySection title="Minors">
        <p>
          LILIA is not directed at children under 14. Do not create an account if you are under 14.
        </p>
      </PrivacySection>

      <PrivacySection title="Changes">
        <p>
          We will change this page when the product changes (for example a different default model
          provider). The date at the top is the last update.
        </p>
      </PrivacySection>
    </PolicyArticle>
  );
}
