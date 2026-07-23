import { EditGroupMembersScreen } from '@/app/groups/components/EditGroupMembersScreen';

export default async function EditGroupMembersPage(
  props: PageProps<'/groups/[groupSessionId]/members'>,
) {
  const { groupSessionId } = await props.params;
  return <EditGroupMembersScreen groupSessionId={groupSessionId} />;
}
