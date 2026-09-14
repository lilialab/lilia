import { EditCharacterScreen } from '@/app/explore/components/EditCharacterScreen';

export default async function EditCharacterPage(
  props: PageProps<'/explore/[characterId]/edit'>,
) {
  const { characterId } = await props.params;
  return <EditCharacterScreen characterId={characterId} />;
}
