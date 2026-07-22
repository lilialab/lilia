import { ChatScreen } from '../components/ChatScreen';

export default async function ChatCharacterPage(props: PageProps<'/chat/[characterId]'>) {
  const { characterId } = await props.params;
  return <ChatScreen characterId={characterId} />;
}
