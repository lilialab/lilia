import { parseLanguageReturnTo } from '@/i18n/language-return';
import { LanguageScreen } from './LanguageScreen';

export default async function LanguagePage(props: PageProps<'/language'>) {
  const { from } = await props.searchParams;
  return <LanguageScreen returnTo={parseLanguageReturnTo(from)} />;
}
