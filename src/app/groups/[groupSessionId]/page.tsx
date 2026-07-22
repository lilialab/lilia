import { GroupChatScreen } from '@/app/groups/components/GroupChatScreen';

export default async function GroupChatPage(props: PageProps<'/groups/[groupSessionId]'>) {
  const { groupSessionId } = await props.params;
  return <GroupChatScreen groupSessionId={groupSessionId} />;
}
