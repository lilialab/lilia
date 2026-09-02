import type { Metadata } from 'next';
import { parsePrivacyReturnTo } from './privacy-return';
import { PrivacyPolicyBody } from './PrivacyPolicyBody';
import { PrivacyScreen } from './PrivacyScreen';

export const metadata: Metadata = {
  title: 'Privacy Policy · Lilia',
  description: 'What Lilia collects, where it goes, and how you can delete it.',
};

export default async function PrivacyPage(props: PageProps<'/privacy'>) {
  const { from } = await props.searchParams;
  return (
    <PrivacyScreen returnTo={parsePrivacyReturnTo(from)}>
      <PrivacyPolicyBody />
    </PrivacyScreen>
  );
}
