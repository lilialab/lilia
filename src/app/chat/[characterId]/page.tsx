import { ChatScreen } from '../components/ChatScreen';

interface ChatCharacterPageProps {
  params: Promise<{ characterId: string }>;
}

export default async function ChatCharacterPage({ params }: ChatCharacterPageProps) {
  const { characterId } = await params;
  return <ChatScreen characterId={characterId} />;
}
