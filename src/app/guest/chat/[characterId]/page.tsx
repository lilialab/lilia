import { GuestChatScreen } from '@/app/guest/components/GuestChatScreen';
import { env } from '@/lib/server/env';

interface GuestChatPageProps {
  params: Promise<{ characterId: string }>;
}

export default async function GuestChatPage({ params }: GuestChatPageProps) {
  const { characterId } = await params;
  return (
    <GuestChatScreen
      characterId={characterId}
      turnstileSiteKey={env.TURNSTILE_SITE_KEY}
    />
  );
}
