import { ExploreCharacterScreen } from '@/app/explore/components/ExploreCharacterScreen';

export default async function ExploreCharacterPage(
  props: PageProps<'/explore/[characterId]'>,
) {
  const { characterId } = await props.params;
  return <ExploreCharacterScreen characterId={characterId} />;
}
