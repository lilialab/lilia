import { env } from '@/lib/server/env';
import { RegisterForm } from './RegisterForm';

export default function RegisterPage() {
  return <RegisterForm turnstileSiteKey={env.TURNSTILE_SITE_KEY} />;
}
