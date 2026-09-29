import { env } from '@/lib/server/env';
import { LoginForm } from './LoginForm';

export default function LoginPage() {
  return <LoginForm turnstileSiteKey={env.TURNSTILE_SITE_KEY} />;
}
